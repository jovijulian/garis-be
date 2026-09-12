const { BaseModelBooking } = require('../../config/database');

class ReimbursementDetail extends BaseModelBooking {
    static get tableName() {
        return 'reimbursement_details';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['reimbursement_id', 'item_id'],
            properties: {
                id: { type: 'integer' },
                reimbursement_id: { type: 'integer' },
                item_id: { type: 'integer' },
                claim_amount: { type: ['number', 'string'], default: 0 }, 
                paid_amount: { type: ['number', 'string'], default: 0 },
                notes: { type: 'string', nullable: true }
            }
        };
    }

    static get relationMappings() {
        const Reimbursement = require('./Reimbursement');
        const ReimbursementItem = require('./ReimbursementItem');

        return {
            reimbursement: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Reimbursement,
                join: {
                    from: 'reimbursement_details.reimbursement_id',
                    to: 'reimbursements.id'
                }
            },
            item: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: ReimbursementItem,
                join: {
                    from: 'reimbursement_details.item_id',
                    to: 'reimbursement_items.id'
                }
            }
        };
    }
}

module.exports = ReimbursementDetail;