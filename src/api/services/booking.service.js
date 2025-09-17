const bookingRepository = require('../repositories/booking.repository');
const userRepository = require('../repositories/user.repository');
const roomRepository = require('../repositories/room.repository');
const { knexBooking } = require('../../config/database');
const { getUserId, formatDateTime } = require('../helpers/dataHelpers');
const moment = require('moment');
const { sendBookingStatusEmail, sendNewBookingNotificationEmail, sendBookingUpdatedNotificationEmail, sendRescheduleNotificationEmail, sendAdminCancellationEmail, sendAutoRejectionEmail } = require('./email.service');

class BookingService {
    async createBooking(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        try {
            const conflicts = await bookingRepository.findConflicts(payload.room_id, payload.start_time, payload.end_time);
            const durationMinutes = moment(payload.end_time).diff(moment(payload.start_time), 'minutes');
            const userWhoBooked = await userRepository.findById(userId);
            const roomToBook = await roomRepository.findById(payload.room_id);
            const adminsOfSite = await userRepository.findAdminsBySiteId(roomToBook.cab_id);
            const adminEmails = adminsOfSite.map(admin => admin.email);
            return knexBooking.transaction(async (trx) => {
                const insertPayload = {
                    id_user: userId,
                    room_id: payload.room_id,
                    purpose: payload.purpose,
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                    duration_minutes: durationMinutes,
                    notes: payload.notes,
                    status: 'Submit',
                    is_conflicting: conflicts.length > 0 ? 1 : 0,
                    created_at: formatDateTime(),
                    updated_at: formatDateTime()

                };
                const newBooking = await bookingRepository.create(insertPayload, trx);
                if (conflicts.length > 0) {
                    const conflictIds = conflicts.map(booking => booking.id);
                    await bookingRepository.markAsConflicting(conflictIds, trx);
                }

                if (payload.amenity_ids && payload.amenity_ids.length > 0) {
                    const amenityPayload = payload.amenity_ids.map(id => ({
                        booking_id: newBooking.id,
                        amenity_id: id
                    }));
                    await bookingRepository.createAmenities(amenityPayload, trx);
                }
                if (adminEmails.length > 0) {
                    const emailDetails = {
                        ...newBooking,
                        user: userWhoBooked,
                        room: roomToBook,
                    };
                    await sendNewBookingNotificationEmail(adminEmails, emailDetails);
                }
                return newBooking;
            });
        } catch (err) {
            throw err;
        }
    }
    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? bookingRepository.findAllWithFilters(queryParams, siteId)
            : bookingRepository.findAllWithFilters(queryParams);
    }


    async getAllBookingUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return bookingRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async getBookingById(bookingId) {
        const booking = await bookingRepository.findByIdWithRelations(bookingId, '[room, user, amenities]');
        if (!booking) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        return booking;
    }

    async updateBooking(bookingId, request) {
        const payload = request.body;
        const existingBooking = await this.getBookingById(bookingId);

        if (existingBooking.status !== 'Submit') {
            const error = new Error('This booking cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        const conflicts = await bookingRepository.findConflicts(payload.room_id, payload.start_time, payload.end_time, bookingId);
        const durationMinutes = moment(payload.end_time).diff(moment(payload.start_time), 'minutes');
        return knexBooking.transaction(async (trx) => {
            const insertPayload = {
                room_id: payload.room_id,
                start_time: payload.start_time,
                end_time: payload.end_time,
                duration_minutes: durationMinutes,
                purpose: payload.purpose,
                status: payload.status || 'Submit',
                // status: payload.status || 'Submit',
                is_conflicting: conflicts.length > 0 ? 1 : 0,
                updated_at: formatDateTime()
            };
            const updatedBooking = await bookingRepository.update(bookingId, insertPayload, trx);

            const emailDetails = {
                ...updatedBooking,
                user: existingBooking.user,
                room: existingBooking.room,
            };
            await sendRescheduleNotificationEmail(emailDetails);
            return updatedBooking;
        });
    }

    async updateBookingUser(bookingId, request) {
        const payload = request.body;
        const existingBooking = await this.getBookingById(bookingId);

        if (existingBooking.status !== 'Submit') {
            const error = new Error('This booking cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
        const adminsOfSite = await userRepository.findAdminsBySiteId(existingBooking.room.cab_id);
        const adminEmails = adminsOfSite.map(admin => admin.email);
        const conflicts = await bookingRepository.findConflicts(payload.room_id, payload.start_time, payload.end_time, bookingId);
        const durationMinutes = moment(payload.end_time).diff(moment(payload.start_time), 'minutes');
        return knexBooking.transaction(async (trx) => {
            const insertPayload = {
                room_id: payload.room_id,
                start_time: payload.start_time,
                end_time: payload.end_time,
                duration_minutes: durationMinutes,
                purpose: payload.purpose,
                notes: payload.notes,
                is_conflicting: conflicts.length > 0 ? 1 : 0,
                updated_at: formatDateTime()
            };
            const updatedBooking = await bookingRepository.update(bookingId, insertPayload, trx);
            await bookingRepository.deleteAmenitiesByBookingId(bookingId, trx);
            const amenityPayload = payload.amenity_ids.map(id => ({
                booking_id: updatedBooking.id,
                amenity_id: id
            }));
            await bookingRepository.createAmenities(amenityPayload, trx);
            if (adminEmails.length > 0) {
                const emailDetails = {
                    ...existingBooking,
                    ...updatedBooking,
                };
                await sendBookingUpdatedNotificationEmail(adminEmails, emailDetails);
            }

            return updatedBooking;
        });
    }

    async deleteBooking(bookingId) {
        const existingBooking = await this.getBookingById(bookingId);

        if (existingBooking.status !== 'Submit') {
            const error = new Error('This booking cannot be deleted as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            await bookingRepository.deleteAmenitiesByBookingId(bookingId, trx);
            await bookingRepository.delete(bookingId, trx);
            return { message: 'Booking has been deleted successfully.' };
        });
    }

    async updateBookingStatus(bookingId, request) {
        const payload = request.body;
        const authUser = getUserId(request);
        const bookingToUpdate = await this.getBookingById(bookingId);
    
        if (!bookingToUpdate) {
            const error = new Error("Booking not found.");
            error.statusCode = 404;
            throw error;
        }
    
        const { updatedBooking, rejectedBookingsForEmail } =
            await knexBooking.transaction(async (trx) => {
                const rejectedBookingsForEmail = [];
    
                if (payload.status === "Approved") {
                    const approvedConflicts = await bookingRepository.findApprovedConflicts(
                        bookingToUpdate.room_id,
                        bookingToUpdate.start_time,
                        bookingToUpdate.end_time,
                        bookingId,
                        trx
                    );
    
                    if (approvedConflicts.length > 0) {
                        const error = new Error(
                            "Gagal, jadwal ini bentrok dengan booking lain yang sudah disetujui."
                        );
                        error.statusCode = 409;
                        throw error;
                    }
    
                    const pendingConflicts = await bookingRepository.findSubmitConflicts(
                        bookingToUpdate.room_id,
                        bookingToUpdate.start_time,
                        bookingToUpdate.end_time,
                        bookingId,
                        trx
                    );
    
                    for (const conflict of pendingConflicts) {
                        await bookingRepository.update(
                            conflict.id,
                            { status: "Rejected" },
                            trx
                        );
                        rejectedBookingsForEmail.push(conflict);
                    }
                }
    
                const updatePayload = {
                    status: payload.status,
                    approved_by: authUser,
                };
    
                const updatedBooking = await bookingRepository.update(
                    bookingId,
                    updatePayload,
                    trx
                );
    
                return { updatedBooking, rejectedBookingsForEmail };
            });
    
        try {
            const mainEmailDetails = { ...bookingToUpdate, status: payload.status };
            await sendBookingStatusEmail(mainEmailDetails);
        } catch (err) {
            console.error("Gagal kirim email utama:", err.message);
        }
    
        for (const rejectedBooking of rejectedBookingsForEmail) {
            try {
                const emailDetails =
                    await bookingRepository.findByIdWithRelations(
                        rejectedBooking.id,
                        "[room, user, amenities]"
                    );
                await sendAutoRejectionEmail(emailDetails);
            } catch (err) {
                console.error(
                    `Gagal kirim email auto-reject untuk booking ${rejectedBooking.id}:`,
                    err.message
                );
            }
        }
    
        return updatedBooking;
    }
    
    async checkAvailability(request) {
        const { room_id, start_time, end_time } = request.query;
        if (!room_id || !start_time || !end_time) {
            const error = new Error('room_id, start_time, and end_time are required.');
            error.statusCode = 400;
            throw error;
        }
        const conflict = await bookingRepository.findFirstApprovedConflict(room_id, start_time, end_time);

        if (conflict) {
            return {
                is_available: false,
                conflictingBooking: {
                    purpose: conflict.purpose,
                    booked_by: conflict.user.nama_user
                }
            };
        }

        return { is_available: true };
    }

    async cancelBooking(bookingId) {
        const existingBooking = await this.getBookingById(bookingId);
        if (!existingBooking) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            const updatedBooking = await bookingRepository.update(bookingId, { status: 'Canceled', updated_at: formatDateTime() }, trx);
            const bookingDetailsForEmail = { ...existingBooking, status: 'Canceled' };
            await sendAdminCancellationEmail(bookingDetailsForEmail);
            return updatedBooking;
        });
    }
}



module.exports = new BookingService();