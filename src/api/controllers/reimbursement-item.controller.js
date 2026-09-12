const reimbursementItemService = require('../services/reimbursement-item.service');
const { success, error, paginated } = require('../../utils/response');

class ReimbursementItemController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await reimbursementItemService.create(payload);
            return success(res, 201, data, 'Item created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await reimbursementItemService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Items retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementItemService.detail(id);
            return success(res, 200, data, 'Item retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await reimbursementItemService.update(id, payload);
            return success(res, 200, data, 'Item updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await reimbursementItemService.delete(id);
            return success(res, 200, null, 'Item has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await reimbursementItemService.options(params);
            return success(res, 200, data, 'Item options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ReimbursementItemController();