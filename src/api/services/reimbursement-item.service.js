const reimbursementItemRepository = require('../repositories/reimbursement-item.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class ReimbursementItemService {

    async getAll(queryParams) {
        return reimbursementItemRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await reimbursementItemRepository.findById(id);
        if (!data) {
            const error = new Error('Item not found.');
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

                const data = await reimbursementItemRepository.create(payload, trx);
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

                const data = await reimbursementItemRepository.update(id, payload, trx);
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
                const data = await reimbursementItemRepository.update(id, { is_active: 0 }, trx);
    
                if (!data) {
                    const error = new Error('Failed to deleted Item.');
                    error.statusCode = 500;
                    throw error;
                }
    
                return { message: 'Item has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }
        
    }

    async options(params) {
        const data = await reimbursementItemRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new ReimbursementItemService();