const orderService = require('../services/order.service');
const { success, error, paginated } = require('../../utils/response');

class OrderController {

    async create(req, res) {
        try {
            const data = await orderService.create(req);
            return success(res, 201, data, 'Order created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await orderService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Orders retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await orderService.getAllUser(req.query);
            return paginated(res, 200, paginatedData, 'Orders retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await orderService.detail(id);
            return success(res, 200, data, 'Order retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await orderService.update(id, req);
            return success(res, 200, data, 'Order updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await orderService.delete(id);
            return success(res, 200, null, 'Order has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const site = req.query.site || null;
            const data = await orderService.options(params, site);
            return success(res, 200, data, 'Order options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const id = req.params.id;

            const data = await orderService.updateOrderStatus(id, req);
            return success(res, 200, data, 'Order status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async generateReceipt(req, res) {
        try {
            const orderId = req.params.id;
            const html = await orderService.generateReceiptHtml(orderId);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new OrderController();