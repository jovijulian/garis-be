const consumptionTypeRepository = require('../repositories/consumption-type.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class ConsumptionTypeService {

    async getAll(queryParams) {
        return consumptionTypeRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await consumptionTypeRepository.findById(id);
        if (!data) {
            const error = new Error('Consumption Type not found.');
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

                const data = await consumptionTypeRepository.create(payload, trx);
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

                const data = await consumptionTypeRepository.update(id, payload, trx);
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
                const data = await consumptionTypeRepository.update(id, { is_active: 0 }, trx);
    
                if (!data) {
                    const error = new Error('Failed to deleted Consumption Type.');
                    error.statusCode = 500;
                    throw error;
                }
    
                return { message: 'Consumption Type has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }
        
    }

    async options(params) {
        const data = await consumptionTypeRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new ConsumptionTypeService();