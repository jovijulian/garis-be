const topicRepository = require('../repositories/topic.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class TopicService {

    async getAll(queryParams) {
        return topicRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await topicRepository.findById(id);
        if (!data) {
            const error = new Error('Topic not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload) {
        try {
            return knexBooking.transaction(async (trx) => {
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();

                const data = await topicRepository.create(payload, trx);
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
                payload.updated_at = formatDateTime();

                const data = await topicRepository.update(id, payload, trx);
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
                const data = await topicRepository.update(id, { is_active: 0 }, trx);
    
                if (!data) {
                    const error = new Error('Failed to deleted topic.');
                    error.statusCode = 500;
                    throw error;
                }
    
                return { message: 'Room has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }
        
    }

    async options(params) {
        const data = await topicRepository.options(params);

        if (!data || data.length === 0) {
            const error = new Error('No Topics found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }
}

module.exports = new TopicService();