const bookingService = require('../services/booking.service');
const { success, error, paginated } = require('../../utils/response');

class RoomController {

    async createBooking(req, res) {
        try {
            const data = await bookingService.createBooking(req);
            return success(res, 201, data, 'Booking created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await bookingService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Bookings retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllBookingUser(req, res) {
        try {
            const paginatedData = await bookingService.getAllBookingUser(req);
            return paginated(res, 200, paginatedData, 'Bookings retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await bookingService.getBookingById(id);
            return success(res, 200, data, 'Room retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await bookingService.updateBooking(id, req);
            return success(res, 200, data, 'Room updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateUser(req, res) {
        try {
            const id = req.params.id;

            const data = await bookingService.updateBookingUser(id, req);
            return success(res, 200, data, 'Room updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await bookingService.deleteBooking(id);
            return success(res, 200, null, 'Room has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateBookingStatus(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await bookingService.updateBookingStatus(id, req);
            return success(res, 200, data, 'Room updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async checkAvailability(req, res) {
        try {
            const data = await bookingService.checkAvailability(req);
            return success(res, 200, data, 'Availability checked successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new RoomController();