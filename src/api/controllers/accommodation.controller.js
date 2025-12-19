const accommodationService = require('../services/accommodation.service');
const { success, error, paginated } = require('../../utils/response');
const moment = require('moment');
class AccommodationController {

    async create(req, res) {
        try {
            const data = await accommodationService.create(req);
            return success(res, 201, data, 'Accommodation created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await accommodationService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Accommodations retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await accommodationService.getAllUser(req);
            return paginated(res, 200, paginatedData, 'Accommodations retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await accommodationService.detail(id);
            return success(res, 200, data, 'Accommodation retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await accommodationService.update(id, req);
            return success(res, 200, data, 'Accommodation updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await accommodationService.delete(id);
            return success(res, 200, null, 'Accommodation has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const site = req.query.site || null;
            const data = await accommodationService.options(params, site);
            return success(res, 200, data, 'Accommodation options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const id = req.params.id;

            const data = await accommodationService.updateOrderStatus(id, req);
            return success(res, 200, data, 'Accommodation status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async cancelOrder(req, res) {
        try {
            const id = req.params.id;

            const data = await accommodationService.cancelOrder(id);
            return success(res, 200, data, 'Accommodation canceled successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async exportToExcel(req, res) {
        try {
            const workbook = await accommodationService.exportOrdersToExcel(req.query);
            
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="accommodation_report_${moment().format('YYYY-MM-DD')}.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async generateReceipt(req, res) {
        try {
            const orderId = req.params.id;
            const html = await accommodationService.generateReceiptHtml(orderId);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new AccommodationController();