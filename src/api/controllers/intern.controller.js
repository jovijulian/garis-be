const internService = require('../services/intern.service');
const { success, error, paginated } = require('../../utils/response');

class InternController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await internService.create(payload);
            return success(res, 201, data, 'User created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await internService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Users retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await internService.detail(id);
            return success(res, 200, data, 'User retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await internService.update(id, payload);
            return success(res, 200, data, 'User updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await internService.delete(id);
            return success(res, 200, null, 'User has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await internService.options(params);
            return success(res, 200, data, 'User options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new InternController();