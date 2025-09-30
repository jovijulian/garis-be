const consumptionTypeService = require('../services/consumption-type.service');
const { success, error, paginated } = require('../../utils/response');

class ConsumptionTypeController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await consumptionTypeService.create(payload);
            return success(res, 201, data, 'Consumption Type created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await consumptionTypeService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Consumption Types retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await consumptionTypeService.detail(id);
            return success(res, 200, data, 'Consumption Type retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await consumptionTypeService.update(id, payload);
            return success(res, 200, data, 'Consumption Type updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await consumptionTypeService.delete(id);
            return success(res, 200, null, 'Consumption Type has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await consumptionTypeService.options(params);
            return success(res, 200, data, 'Consumption Type options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ConsumptionTypeController();