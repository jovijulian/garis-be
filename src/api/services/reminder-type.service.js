const reminderTypeRepository = require('../repositories/reminder-type.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class ReminderTypeService {

    async getAll(queryParams) {
        return reminderTypeRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await reminderTypeRepository.findById(id);
        if (!data) {
            const error = new Error('Reminder Type not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload) {
        try {
            return knexBooking.transaction(async (trx) => {
                payload.notification_intervals = JSON.stringify(payload.notification_intervals)
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();

                const data = await reminderTypeRepository.create(payload, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }

    async update(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                payload.notification_intervals = JSON.stringify(payload.notification_intervals)
                payload.updated_at = formatDateTime();

                const data = await reminderTypeRepository.update(id, payload, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const data = await reminderTypeRepository.update(id, { is_active: 0 }, trx);

                if (!data) {
                    const error = new Error('Failed to deleted reminder type.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Reminder typ has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await reminderTypeRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new ReminderTypeService();