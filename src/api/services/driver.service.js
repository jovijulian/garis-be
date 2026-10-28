const driverRepository = require('../repositories/driver.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
const userRepository = require('../repositories/user.repository');
const internRepository = require('../repositories/intern.repository');
class DriverService {

    async getAll(queryParams) {
        return driverRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await driverRepository.findByIdWithRelations(id, '[user, cabang, intern]');
        if (!data) {
            const error = new Error('Driver not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload) {
        if (payload.id_user) {
            const existingUser = await userRepository.findByUserId(payload.id_user);
            if (!existingUser) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
        } 

        if (payload.intern_id) {
            const existingIntern = await internRepository.findById(payload.intern_id);
            if (!existingIntern) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
        } 
        return knexBooking.transaction(async (trx) => {
            payload.is_external = payload.intern_id ? 1 : 0;
            payload.created_at = formatDateTime();
            payload.updated_at = formatDateTime();

            const data = await driverRepository.create(payload, trx);
            return data;
        });
    }

    async update(id, payload) {
        await this.detail(id);
        if (payload.id_user) {
            const existingUser = await userRepository.findByUserId(payload.id_user);
            if (!existingUser) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
        } 

        if (payload.intern_id) {
            const existingIntern = await userRepository.findById(payload.intern_id);
            if (!existingIntern) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
        } 
        return knexBooking.transaction(async (trx) => {
            payload.is_external = payload.intern_id ? 1 : 0;
            payload.updated_at = formatDateTime();

            const data = await driverRepository.update(id, payload, trx);
            return data;
        });
    }

    async delete(id) {
        await this.detail(id);
        return knexBooking.transaction(async (trx) => {
            const data = await driverRepository.update(id, { is_active: 0 }, trx);

            if (!data) {
                const error = new Error('Failed to deleted driver.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'Driver has been deleted successfully.' };
        });
    }

    async options(params) {
        if (params.start_time && params.end_time) {
            return driverRepository.findAvailableForBooking(params);
        }

        const data = await driverRepository.options(params);
        if (!data || data.length === 0) {
            return [];
        }
        return data;
    }


    async updateStatus(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const data = await driverRepository.updateStatus(id, { status: payload.status, updated_at: formatDateTime() }, trx);
                return data;
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DriverService();