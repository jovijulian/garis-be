const transportTypeRepository = require('../repositories/transport-type.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class TransportTypeService {

    async getAll(queryParams) {
        return transportTypeRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await transportTypeRepository.findById(id);
        if (!data) {
            const error = new Error('Transport type not found.');
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

                const data = await transportTypeRepository.create(payload, trx);
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

                const data = await transportTypeRepository.update(id, payload, trx);
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
                const data = await transportTypeRepository.update(id, { is_active: 0 }, trx)

                if (!data) {
                    const error = new Error('Failed to deleted transport type.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Transport type has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await transportTypeRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new TransportTypeService();