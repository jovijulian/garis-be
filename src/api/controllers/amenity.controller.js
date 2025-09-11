const amenityService = require('../services/amenity.service');
const { success, error, paginated } = require('../../utils/response');

class AmenityController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await amenityService.create(payload);
            return success(res, 201, data, 'Amenity created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await amenityService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Amenities retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await amenityService.detail(id);
            return success(res, 200, data, 'Amenity retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await amenityService.update(id, payload);
            return success(res, 200, data, 'Amenity updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await amenityService.delete(id);
            return success(res, 200, null, 'Amenity has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await amenityService.options(params);
            return success(res, 200, data, 'Amenity options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new AmenityController();