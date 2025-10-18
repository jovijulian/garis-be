const vehicleRequestService = require('../services/vehicle-request.service');
const { success, error, paginated } = require('../../utils/response');
const moment = require('moment');
class VehicleRequestController {

    async create(req, res) {
        try {
            const data = await vehicleRequestService.create(req);
            return success(res, 201, data, 'Vehicle Request created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await vehicleRequestService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Vehicle Requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await vehicleRequestService.getAllUser(req);
            return paginated(res, 200, paginatedData, 'Vehicle Requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.detail(id);
            return success(res, 200, data, 'Vehicle Request retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.update(id, req);
            return success(res, 200, data, 'Vehicle Request updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await vehicleRequestService.delete(id);
            return success(res, 200, null, 'Vehicle Request has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateVehicleRequestStatus(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.updateVehicleRequestStatus(id, req);
            return success(res, 200, data, 'Vehicle Request status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async cancelRequest(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.cancelRequest(id);
            return success(res, 200, data, 'Vehicle Request canceled successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async assignVehicle(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.assignVehicle(id, req);
            return success(res, 201, data, 'Vehicle assigned successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async removeVehicleAssignment(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.removeVehicleAssignment(id);
            return success(res, 200, data, 'Vehicle assignment removed');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async assignDriver(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.assignDriver(id, req);
            return success(res, 201, data, 'Driver assigned successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async removeDriverAssignment(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.removeDriverAssignment(id);
            return success(res, 200, data, 'Driver assignment removed');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }


}

module.exports = new VehicleRequestController();