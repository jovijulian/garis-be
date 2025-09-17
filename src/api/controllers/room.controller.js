const roomService = require('../services/room.service');
const { success, error, paginated } = require('../../utils/response');

class RoomController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await roomService.create(payload);
            return success(res, 201, data, 'Room created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await roomService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Rooms retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await roomService.detail(id);
            return success(res, 200, data, 'Room retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await roomService.update(id, payload);
            return success(res, 200, data, 'Room updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await roomService.delete(id);
            return success(res, 200, null, 'Room has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const site = req.query.site || null;
            const data = await roomService.options(params, site);
            return success(res, 200, data, 'Room options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsSite(req, res) {
        try {
            const params = req.query.search;
            const data = await roomService.optionsSite(params);
            return success(res, 200, data, 'Site options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new RoomController();