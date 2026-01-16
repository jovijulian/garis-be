const transportOrderService = require('../services/transport-order.service');
const { success, error, paginated } = require('../../utils/response');
const moment = require('moment');
class TransportOrderController {

    async create(req, res) {
        try {
            const data = await transportOrderService.create(req);
            return success(res, 201, data, 'Transport Order created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await transportOrderService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Transport Orders retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await transportOrderService.getAllUser(req);
            return paginated(res, 200, paginatedData, 'Transport Orders retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await transportOrderService.detail(id);
            return success(res, 200, data, 'Transport Order retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await transportOrderService.update(id, req);
            return success(res, 200, data, 'Transport Order updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await transportOrderService.delete(id);
            return success(res, 200, null, 'Transport Order has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const site = req.query.site || null;
            const data = await transportOrderService.options(params, site);
            return success(res, 200, data, 'Transport Order options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const id = req.params.id;

            const data = await transportOrderService.updateOrderStatus(id, req);
            return success(res, 200, data, 'Transport Order status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async cancelOrder(req, res) {
        try {
            const id = req.params.id;

            const data = await transportOrderService.cancelOrder(id);
            return success(res, 200, data, 'Transport Order canceled successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async exportToExcel(req, res) {
        try {
            const workbook = await transportOrderService.exportOrdersToExcel(req.query);

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="transport_order_report${moment().format('YYYY-MM-DD')}.xlsx"`
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
            const html = await transportOrderService.generateReceiptHtml(orderId);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new TransportOrderController();