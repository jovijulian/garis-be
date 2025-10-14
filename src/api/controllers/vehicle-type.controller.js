const vehicleTypeService = require('../services/vehicle-type.service');
const { success, error, paginated } = require('../../utils/response');

class VehicleTypeController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await vehicleTypeService.create(payload);
            return success(res, 201, data, 'Vehicle type created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await vehicleTypeService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Vehicle types retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleTypeService.detail(id);
            return success(res, 200, data, 'Vehicle type retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await vehicleTypeService.update(id, payload);
            return success(res, 200, data, 'Vehicle type updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await vehicleTypeService.delete(id);
            return success(res, 200, null, 'Vehicle type has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await vehicleTypeService.options(params);
            return success(res, 200, data, 'Vehicle type options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new VehicleTypeController();