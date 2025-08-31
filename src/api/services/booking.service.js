const bookingRepository = require('../repositories/booking.repository');
const { knexConnection } = require('../../config/database');
const { getUserId } = require('../helpers/dataHelpers');
const moment = require('moment');

class BookingService {
    async createBooking(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const { roomId, bookingDate, startTime, durationMinutes } = payload;

        const endTime = calculateEndTime(startTime, durationMinutes);

        const conflicts = await bookingRepository.findApprovedConflicts(roomId, bookingDate, startTime, endTime);
        if (conflicts && conflicts.length > 0) {
            const error = new Error('Booking conflict: The room is already booked and approved for the selected time.');
            error.statusCode = 409;
            throw error;
        }

        return knexConnection.transaction(async (trx) => {
            const insertPayload = {
                user_id: userId,
                room_id: payload.roomId,
                booking_date: payload.bookingDate,
                start_time: payload.startTime,
                duration_minutes: payload.durationMinutes,
                purpose: payload.purpose,
                status: 'Submit'
            };
            const newBooking = await bookingRepository.create(insertPayload, trx);
            return newBooking;
        });
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