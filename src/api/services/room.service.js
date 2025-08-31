const roomRepository = require('../repositories/room.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexConnection } = require('../../config/database');
class RoomService {

    async getAll(queryParams) {
        return roomRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await roomRepository.findById(id);
        if (!data) {
            const error = new Error('Room not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload) {
        return knexConnection.transaction(async (trx) => {
            payload.created_at = formatDateTime();
            payload.updated_at = formatDateTime();

            const data = await roomRepository.create(payload, trx);
            return data;
        });
    }

    async update(id, payload) {
        await this.detail(id);
        return knexConnection.transaction(async (trx) => {
            payload.updated_at = formatDateTime();

            const data = await roomRepository.update(id, payload, trx);
            return data;
        });
    }

    async delete(id) {
        await this.detail(id);
        return knexConnection.transaction(async (trx) => {
            const data = await roomRepository.update(id, { deleted_at: formatDateTime() }, trx);

            if (!data) {
                const error = new Error('Failed to deleted concentrator.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'Concentrator has been deleted successfully.' };
        });
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
}

module.exports = new RoomService();