const roomRepository = require('../repositories/room.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class RoomService {

    async getAll(queryParams) {
        return roomRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await roomRepository.findByIdWithRelations(id, '[cabang, amenities]');
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
                const { amenity_ids, ...roomData } = payload; 

                roomData.created_at = formatDateTime();
                roomData.updated_at = formatDateTime();
                const createdRoom = await roomRepository.create(roomData, trx);
                if (amenity_ids && Array.isArray(amenity_ids)) {
                    await roomRepository.syncAmenities(createdRoom.id, amenity_ids, trx);
                } else {
                    await roomRepository.syncAmenities(createdRoom.id, [], trx);
                }

                return createdRoom;
            });
        } catch (error) {
            throw error;
        }
    }

    async update(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const { amenity_ids, ...roomData } = payload;
                
                roomData.updated_at = formatDateTime();

                const updatedRoom = await roomRepository.update(id, roomData, trx);
                if (amenity_ids && Array.isArray(amenity_ids)) {
                    await roomRepository.syncAmenities(id, amenity_ids, trx);
                }

                return updatedRoom;
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

    async options(params, site) {
        const data = await roomRepository.options(params, site);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }

    async optionsSite(params) {
        const data = await roomRepository.optionsSite(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new RoomService();