const { BaseModelBooking } = require('../../config/database');

class ReimbursementAttachment extends BaseModelBooking {
    static get tableName() {
        return 'reimbursement_attachments';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['reimbursement_id', 'file_url', 'file_name'],
            properties: {
                id: { type: 'integer' },
                reimbursement_id: { type: 'integer' },
                file_url: { type: 'string', maxLength: 255 },
                file_name: { type: 'string', maxLength: 255 },
                file_type: { type: 'string', maxLength: 50, nullable: true },
                created_at: { type: 'string', format: 'date-time' }
            }
        };
    }

    static get relationMappings() {
        const Reimbursement = require('./Reimbursement');

        return {
            reimbursement: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Reimbursement,
                join: {
                    from: 'reimbursement_attachments.reimbursement_id',
                    to: 'reimbursements.id'
                }
            }
        };
    }
}

module.exports = ReimbursementAttachment;