const reminderRepository = require('../repositories/reminder.repository');
const { formatDateTime, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class ReminderService {

    async getAll(request, queryParams) {
        const cabId = getCabId(request)
        return reminderRepository.findAllWithFilters(cabId, queryParams);
    }

    async detail(id) {
        const data = await reminderRepository.findByIdWithRelations(id, '[cabang, reminder_type]');
        if (!data) {
            const error = new Error('Reminder not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(request, payload) {
        const cabId = getCabId(request);
        try {
            return knexBooking.transaction(async (trx) => {
                payload.cab_id = cabId;
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();
                const reminder = await reminderRepository.create(payload, trx);
                
                return reminder;
            });
        } catch (error) {
            throw error;
        }
    }

    async update(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();
                const reminder = await reminderRepository.update(id, payload, trx);
                
                return reminder;
            });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const data = await reminderRepository.update(id, { is_active: 0 }, trx);
    
                if (!data) {
                    const error = new Error('Failed to deleted reminder.');
                    error.statusCode = 500;
                    throw error;
                }
    
                return { message: 'Reminder has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }
        
    }

    async options(params) {
        const data = await reminderRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }

}

module.exports = new ReminderService();