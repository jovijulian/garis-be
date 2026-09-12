const { BaseModelBooking } = require('../../config/database');

class ReimbursementItem extends BaseModelBooking {
    static get tableName() {
        return 'reimbursement_items';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['item_name'],
            properties: {
                id: { type: 'integer' },
                item_name: { type: 'string', maxLength: 100 },
                is_default: { type: 'integer', default: 0 },
                is_active: { type: 'integer', default: 1 },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
            }
        };
    }
}

module.exports = ReimbursementItem;