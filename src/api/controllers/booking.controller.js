const bookingService = require('../services/booking.service');
const { success, error, paginated } = require('../../utils/response');
const moment = require('moment');
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
            return success(res, 200, data, 'Booking retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await bookingService.updateBooking(id, req);
            return success(res, 200, data, 'Booking updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateUser(req, res) {
        try {
            const id = req.params.id;

            const data = await bookingService.updateBookingUser(id, req);
            return success(res, 200, data, 'Booking updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await bookingService.deleteBooking(id);
            return success(res, 200, null, 'Booking has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateBookingStatus(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await bookingService.updateBookingStatus(id, req);
            return success(res, 200, data, 'Booking updated successfully');
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

    async cancelBooking(req, res) {
        try {
            const id = req.params.id;

            const data = await bookingService.cancelBooking(id);
            return success(res, 200, data, 'Booking canceled successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
    async forceApproveBooking(req, res) {
        try {
            const id = req.params.id;
            const data = await bookingService.forceApproveBooking(id, req);
            return success(res, 200, data, 'Booking force approved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async uploadProof(req, res) {
        try {
            const bookingId = req.params.id;
            const updatedBooking = await bookingService.uploadBookingProof(bookingId, req);
            return success(res, 200, updatedBooking, 'Bukti booking berhasil diupload.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async exportToExcel(req, res) {
        try {
            const workbook = await bookingService.exportBookingsToExcel(req.query);
            
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="booking_report_${moment().format('YYYY-MM-DD')}.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await bookingService.options(req, params);
            return success(res, 200, data, 'Booking options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getSchedule(req, res) {
        try {
            const data = await bookingService.getSchedule(req.query);
            return success(res, 200, data, 'Booking schedule retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new RoomController();