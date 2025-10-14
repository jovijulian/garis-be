const vehicleTypeRepository = require('../repositories/vehicle-type.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class VehicleTypeService {

    async getAll(queryParams) {
        return vehicleTypeRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await vehicleTypeRepository.findById(id);
        if (!data) {
            const error = new Error('Vehicle type not found.');
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

                const data = await vehicleTypeRepository.create(payload, trx);
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

                const data = await vehicleTypeRepository.update(id, payload, trx);
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
                const data = await vehicleTypeRepository.delete(id, trx)

                if (!data) {
                    const error = new Error('Failed to deleted vehicle type.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Vehicle type has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await vehicleTypeRepository.options(params);

        if (!data || data.length === 0) {
            const error = new Error('No Vehicle types found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }
}

module.exports = new VehicleTypeService();