const reminderTypeService = require('../services/reminder-type.service');
const { success, error, paginated } = require('../../utils/response');

class ReminderTypeController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await reminderTypeService.create(payload);
            return success(res, 201, data, 'Reminder Type created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await reminderTypeService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Reminder Types retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await reminderTypeService.detail(id);
            return success(res, 200, data, 'Reminder Type retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await reminderTypeService.update(id, payload);
            return success(res, 200, data, 'Reminder Type updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await reminderTypeService.delete(id);
            return success(res, 200, null, 'Reminder Type has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await reminderTypeService.options(params);
            return success(res, 200, data, 'Reminder Type options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ReminderTypeController();