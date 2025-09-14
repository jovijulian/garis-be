const roomRepository = require('../repositories/room.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class RoomService {

    async getAll(queryParams) {
        return roomRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await roomRepository.findByIdWithRelations(id, '[cabang]');
        if (!data) {
            const error = new Error('Room not found.');
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

                const data = await roomRepository.create(payload, trx);
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

                const data = await roomRepository.update(id, payload, trx);
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
                const data = await roomRepository.update(id, { is_active: 0 }, trx);
    
                if (!data) {
                    const error = new Error('Failed to deleted room.');
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
        const data = await roomRepository.options(params);

        if (!data || data.length === 0) {
            const error = new Error('No Rooms found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }

    async optionsSite(params) {
        const data = await roomRepository.optionsSite(params);

        if (!data || data.length === 0) {
            const error = new Error('No Sites found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }
}

module.exports = new RoomService();