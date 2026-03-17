const reminderService = require('../services/reminder.service');
const { success, error, paginated } = require('../../utils/response');

class ReminderController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await reminderService.create(req, payload);
            return success(res, 201, data, 'Reminder created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await reminderService.getAll(req, req.query);
            return paginated(res, 200, paginatedData, 'Reminders retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await reminderService.detail(id);
            return success(res, 200, data, 'Reminder retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await reminderService.update(id, payload);
            return success(res, 200, data, 'Reminder updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await reminderService.delete(id);
            return success(res, 200, null, 'Reminder has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await reminderService.options(params);
            return success(res, 200, data, 'Reminder options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ReminderController();