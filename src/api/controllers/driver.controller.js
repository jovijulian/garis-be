const driverService = require('../services/driver.service');
const { success, error, paginated } = require('../../utils/response');

class DriverController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await driverService.create(payload);
            return success(res, 201, data, 'Driver created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await driverService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Drivers retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await driverService.detail(id);
            return success(res, 200, data, 'Driver retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await driverService.update(id, payload);
            return success(res, 200, data, 'Driver updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await driverService.delete(id);
            return success(res, 200, null, 'Driver has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query;
            const data = await driverService.options(params);
            return success(res, 200, data, 'Driver options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new DriverController();