const transportTypeController = require('../services/transport-type.service');
const { success, error, paginated } = require('../../utils/response');

class TransportTypeController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await transportTypeController.create(payload);
            return success(res, 201, data, 'Transport type created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await transportTypeController.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Transport types retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await transportTypeController.detail(id);
            return success(res, 200, data, 'Transport type retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await transportTypeController.update(id, payload);
            return success(res, 200, data, 'Transport type updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await transportTypeController.delete(id);
            return success(res, 200, null, 'Transport type has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await transportTypeController.options(params);
            return success(res, 200, data, 'Transport type options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new TransportTypeController();