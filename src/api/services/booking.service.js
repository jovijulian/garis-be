const bookingRepository = require('../repositories/booking.repository');
const { knexConnection } = require('../../config/database');
const { getUserId } = require('../helpers/dataHelpers');
const moment = require('moment');

class BookingService {
    async createBooking(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        try {
            const conflicts = await bookingRepository.findConflicts(payload.room_id, payload.start_time, payload.end_time);
            return knexConnection.transaction(async (trx) => {
                const insertPayload = {
                    id_user: userId,
                    room_id: payload.room_id,
                    purpose: payload.purpose,
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                    duration_minutes: moment(payload.end_time, 'HH:mm:ss').diff(moment(payload.start_time, 'HH:mm:ss'), 'minutes'),
                    notes: payload.notes,
                    status: 'Submit',
                    is_conflicting: conflicts.length > 0
                };
                const newBooking = await bookingRepository.create(insertPayload, trx);

                if (payload.amenity_ids && payload.amenity_ids.length > 0) {
                    const amenityPayload = payload.amenity_ids.map(id => ({
                        booking_id: newBooking.id,
                        amenity_id: id
                    }));
                    await bookingRepository.createAmenities(amenityPayload, trx);
                }
                return newBooking;
            });
        } catch (err) {
            throw err;
        }
    }

    async getAll(queryParams) {
        return bookingRepository.findAllWithFilters(queryParams);
    }

    async getAllBookingUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return bookingRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async getBookingById(bookingId) {
        const booking = await bookingRepository.findByIdWithRelations(bookingId, '[room, user]');
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

        return knexConnection.transaction(async (trx) => {
            const insertPayload = {
                user_id: existingBooking.user_id,
                room_id: payload.roomId,
                booking_date: payload.bookingDate,
                start_time: payload.startTime,
                duration_minutes: payload.durationMinutes,
                purpose: payload.purpose,
                status: payload.status || 'Submit'
            };
            const updatedBooking = await bookingRepository.update(bookingId, insertPayload, trx);
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

        await bookingRepository.delete(bookingId);
        return { message: 'Booking has been deleted successfully.' };
    }


    async updateBookingStatus(bookingId, payload) {
        const bookingToUpdate = await bookingRepository.findById(bookingId);
        if (!bookingToUpdate) {
            const error = new Error('Booking not found.');
            error.statusCode = 404;
            throw error;
        }

        return knexConnection.transaction(async (trx) => {
            if (payload.status === 'Approved') {
                const endTime = calculateEndTime(bookingToUpdate.start_time, bookingToUpdate.duration_minutes);
                const pendingConflicts = await bookingRepository.findPendingConflicts(
                    bookingToUpdate.room_id,
                    bookingToUpdate.booking_date,
                    bookingToUpdate.start_time,
                    endTime,
                    trx
                );

                for (const conflict of pendingConflicts) {
                    if (conflict.id !== bookingId) {
                        await bookingRepository.updateStatus(conflict.id, 'Rejected', trx);
                    }
                }
            }

            const updatedBooking = await bookingRepository.updateStatus(bookingId, payload.status, trx);
            return updatedBooking;
        });
    }
}

function calculateEndTime(startTime, durationMinutes) {
    const startMoment = moment(startTime, 'HH:mm:ss');
    const endMoment = startMoment.add(durationMinutes, 'minutes');
    const endTime = endMoment.format('HH:mm:ss');
    return endTime;
}


module.exports = new BookingService();