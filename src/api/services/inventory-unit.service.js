const inventoryUnitRepository = require('../repositories/inventory-unit.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
class InventoryUnitService {

    async getAll(queryParams) {
        return inventoryUnitRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await inventoryUnitRepository.findById(id);
        if (!data) {
            const error = new Error('Inventory Unit not found.');
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

                const data = await inventoryUnitRepository.create(payload, trx);
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

                const data = await inventoryUnitRepository.update(id, payload, trx);
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
                const data = await inventoryUnitRepository.update(id, { is_active: 0 }, trx);

                if (!data) {
                    const error = new Error('Failed to deleted unit.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Unit has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await inventoryUnitRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new InventoryUnitService();