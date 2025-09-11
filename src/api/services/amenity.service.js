const amenityRepository = require('../repositories/amenity.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class AmenityService {

    async getAll(queryParams) {
        return amenityRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await amenityRepository.findById(id);
        if (!data) {
            const error = new Error('Amenity not found.');
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

                const data = await amenityRepository.create(payload, trx);
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

                const data = await amenityRepository.update(id, payload, trx);
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
                const data = await amenityRepository.delete(id)

                if (!data) {
                    const error = new Error('Failed to deleted amenity.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Amenity has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await amenityRepository.options(params);

        if (!data || data.length === 0) {
            const error = new Error('No Amenities found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }
}

module.exports = new AmenityService();