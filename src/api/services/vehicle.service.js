const vehicleRepository = require('../repositories/vehicle.repository');
const vehicleTypeRepository = require('../repositories/vehicle-type.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class VehicleService {

    async getAll(queryParams) {
        return vehicleRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await vehicleRepository.findByIdWithRelations(id, '[vehicle_type, cabang]');
        if (!data) {
            const error = new Error('Vehicle not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload) {
        try {
            const vehicleType = await vehicleTypeRepository.findById(payload.vehicle_type_id);
            if (!vehicleType) {
                const error = new Error('Vehicle type not found.');
                error.statusCode = 404;
                throw error;
            }
            const existingVehicle = await vehicleRepository.findByLicensePlate(payload.license_plate);
            if (existingVehicle) {
                const error = new Error('License plate already exists.');
                error.statusCode = 400;
                throw error;
            }
            return knexBooking.transaction(async (trx) => {
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();

                const data = await vehicleRepository.create(payload, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }

    async update(id, payload) {
        await this.detail(id);
        try {
            const vehicleType = await vehicleTypeRepository.findById(payload.vehicle_type_id);
            if (!vehicleType) {
                const error = new Error('Vehicle type not found.');
                error.statusCode = 404;
                throw error;
            }
            return knexBooking.transaction(async (trx) => {
                payload.updated_at = formatDateTime();

                const data = await vehicleRepository.update(id, payload, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        await this.detail(id);
        return knexBooking.transaction(async (trx) => {
            const data = await vehicleRepository.update(id, { is_active: 0 }, trx);

            if (!data) {
                const error = new Error('Failed to deleted vehicle.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'Vehicle has been deleted successfully.' };
        });
    }

    async options(params) {
        if (params.start_time && params.end_time) {
            return vehicleRepository.findAvailableForBooking(params);
        }

        const data = await vehicleRepository.options(params);
        if (!data || data.length === 0) {
            return [];
        }
        return data;
    }

    async updateStatus(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const data = await vehicleRepository.updateStatus(id, { status: payload.status, updated_at: formatDateTime() }, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new VehicleService();