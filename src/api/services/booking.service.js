const bookingRepository = require('../repositories/booking.repository');
const userRepository = require('../repositories/user.repository');
const roomRepository = require('../repositories/room.repository');
const { knexBooking } = require('../../config/database');
const { getUserId, formatDateTime, getRoleUser } = require('../helpers/dataHelpers');
const moment = require('moment');
const { put } = require('@vercel/blob');
const { sendBookingStatusEmail, sendNewBookingNotificationEmail, sendBookingUpdatedNotificationEmail, sendRescheduleNotificationEmail, sendAdminCancellationEmail, sendAutoRejectionEmail } = require('./email.service');
const ExcelJS = require('exceljs');
const momenttz = require('moment-timezone')

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
                    topic_id: payload.topic_id,
                    detail_topic: payload.detail_topic || null,
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
                    for (const amenity of amenityPayload) {
                        await bookingRepository.createAmenities(amenity, trx);
                    }
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
        const booking = await bookingRepository.findByIdWithRelations(bookingId, '[room, user, amenities, topic]');
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
                topic_id: payload.topic_id,
                detail_topic: payload.detail_topic || null,
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
                topic_id: payload.topic_id,
                detail_topic: payload.detail_topic || null,
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
                        "[room, user, amenities, topic]"
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

    async forceApproveBooking(bookingId, request) {
        const authUser = getUserId(request);
        const trx = await knexBooking.transaction();
        let newApprovedBooking;

        try {
            const newBooking = await bookingRepository.findByIdWithRelations(bookingId, '[user, room]');
            if (!newBooking) throw { statusCode: 404, message: 'Booking yang akan disetujui tidak ditemukan.' };

            const oldApprovedConflicts = await bookingRepository.findApprovedConflicts(
                newBooking.room_id, newBooking.start_time, newBooking.end_time, bookingId, trx
            )

            for (const conflict of oldApprovedConflicts) {
                await bookingRepository.update(conflict.id, { status: 'Submit', is_conflicting: 1 }, trx);
            }

            const updatePayload = { status: 'Approved', approved_by: authUser };
            newApprovedBooking = await bookingRepository.update(bookingId, updatePayload, trx);

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const newBookingDetails = await this.getBookingById(bookingId);
            await sendBookingStatusEmail(newBookingDetails);

        } catch (emailError) {
            console.error("Gagal mengirim email notifikasi 'force approve':", emailError);
        }

        return newApprovedBooking;
    }

    async uploadBookingProof(bookingId, request) {
        const file = request.file;
        const admin_note = request.body.admin_note || null;
        if (!file) throw { statusCode: 400, message: 'Tidak ada file yang diupload.' };

        const trx = await knexBooking.transaction();
        try {
            const booking = await bookingRepository.findById(bookingId, null, trx);
            if (!booking) throw { statusCode: 404, message: 'Booking tidak ditemukan.' };

            const fileName = `proof-booking-${bookingId}-${Date.now()}.${file.originalname.split('.').pop()}`;

            const blob = await put(fileName, file.buffer, { access: 'public' });
            const updatedBooking = await bookingRepository.updateProofPath(bookingId, blob.pathname, admin_note, trx);

            await trx.commit();

            return { ...updatedBooking, proof_url: blob.url };
        } catch (error) {
            await trx.rollback();
            console.error("Upload proof error:", error);
            throw { statusCode: 500, message: 'Gagal mengupload file bukti.' };
        }
    }

    async exportBookingsToExcel(queryParams) {
        const bookings = await bookingRepository.findAllForExport(queryParams);
        if (bookings.length > 0) {
            const siteIds = [...new Set(bookings.map(b => b.room.cab_id).filter(id => id != null))];
            const sites = await roomRepository.findByIdsSite(siteIds);
            const siteMap = new Map(sites.map(site => [site.id_cab, site.nama_cab]));
            bookings.forEach(booking => {
                if (booking.room && booking.room.cab_id) {
                    booking.room.site_name = siteMap.get(booking.room.cab_id) || 'Tidak Ditemukan';
                }
            });
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Booking Ruangan');

        worksheet.columns = [
            { header: 'ID Booking', key: 'id', width: 12 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Keperluan', key: 'purpose', width: 40 },
            { header: 'Topik', key: 'topic', width: 25 },
            { header: 'Ruangan', key: 'room', width: 30 },
            { header: 'Cabang', key: 'site', width: 20 },
            { header: 'Pemesan', key: 'user_name', width: 30 },
            { header: 'Email Pemesan', key: 'user_email', width: 30 },
            { header: 'Waktu Mulai', key: 'start_time', width: 22 },
            { header: 'Waktu Selesai', key: 'end_time', width: 22 },
            { header: 'Durasi (Menit)', key: 'duration', width: 15 },
            { header: 'Fasilitas', key: 'amenities', width: 50 },
            { header: 'Catatan User', key: 'notes', width: 50 },
            { header: 'Catatan Admin', key: 'admin_note', width: 50 },
            { header: 'Dibuat Pada', key: 'created_at', width: 22 },
            { header: 'Disetujui/Ditolak Oleh', key: 'approved_by', width: 25 },
        ];

        worksheet.getRow(1).font = { bold: true };

        bookings.forEach(booking => {
            const startTimeWIB = moment(booking.start_time).add(7, 'hours').format('YYYY-MM-DD HH:mm');
            const endTimeWIB = moment(booking.end_time).add(7, 'hours').format('YYYY-MM-DD HH:mm');
            worksheet.addRow({
                id: booking.id,
                status: booking.status,
                purpose: booking.purpose,
                topic: booking.topic ? booking.topic.name : '-',
                room: booking.room ? booking.room.name : '-',
                site: booking.room ? booking.room.site_name : '-',
                user_name: booking.user ? booking.user.nama_user : '-',
                user_email: booking.user ? booking.user.email : '-',
                start_time: startTimeWIB,
                end_time: endTimeWIB,
                duration: booking.duration_minutes,
                amenities: booking.amenities.map(a => a.name).join(', '),
                notes: booking.notes,
                admin_note: booking.admin_note,
                created_at: moment(booking.created_at).add(7, 'hours').format('YYYY-MM-DD HH:mm'),
                approved_by: booking.approved_by || '-',
            });
        });

        return workbook;
    }

    async options(request, search) {
        let userId;
        const roleUser = getRoleUser(request);
        if (roleUser === 2) {
            userId = null
        } else {
            userId = getUserId(request);
        }
        const data = await bookingRepository.options(userId, search);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}



module.exports = new BookingService();