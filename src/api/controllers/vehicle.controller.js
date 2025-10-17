const vehicleService = require('../services/vehicle.service');
const { success, error, paginated } = require('../../utils/response');

class VehicleController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await vehicleService.create(payload);
            return success(res, 201, data, 'Vehicle created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await vehicleService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Vehicles retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleService.detail(id);
            return success(res, 200, data, 'Vehicle retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await vehicleService.update(id, payload);
            return success(res, 200, data, 'Vehicle updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await vehicleService.delete(id);
            return success(res, 200, null, 'Vehicle has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query;
            const data = await vehicleService.options(params);
            return success(res, 200, data, 'Vehicle options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateStatus(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await vehicleService.updateStatus(id, payload);
            return success(res, 200, data, 'Vehicle Status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new VehicleController();