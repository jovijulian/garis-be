const { BaseModelBooking } = require('../../config/database');

class Reimbursement extends BaseModelBooking {
    static get tableName() {
        return 'reimbursements';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [
                'document_number', 'user_id', 'cab_id', 'dept_id', 
                'destination', 'start_date', 'end_date', 
                'duration', 'duration_type', 'purpose'
            ],
            properties: {
                id: { type: 'integer' },
                document_number: { type: 'string', maxLength: 100 },
                user_id: { type: 'string', maxLength: 50 },
                cab_id: { type: 'integer' },
                dept_id: { type: 'integer' },
                destination: { type: 'string', maxLength: 100 },
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' },
                duration: { type: 'integer' },
                duration_type: { type: 'string', enum: ['Hari', 'Malam'] },
                purpose: { type: 'string' },
                participant_count: { type: 'integer', default: 1 },
                total_claim: { type: ['number', 'string'] }, 
                status: {
                    type: 'string',
                    enum: ['WAITING_MANAGER', 'WAITING_GA', 'CLOSED', 'REJECTED']
                },
                is_active: { type: 'integer', default: 1 },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const Department = require('./Department');
        const Approval = require('./Approval');
        const ReimbursementDetail = require('./ReimbursementDetail');
        const ReimbursementAttachment = require('./ReimbursementAttachment');

        return {
            requester: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'reimbursements.user_id',
                    to: 'tb_user.id_user' 
                }
            },
            department: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Department,
                join: {
                    from: 'reimbursements.dept_id',
                    to: 'tb_dept.id_dept' 
                }
            },
            approvals: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: Approval,
                filter: query => query.where('module_name', 'REIMBURSEMENT'), 
                join: {
                    from: 'reimbursements.id',
                    to: 'approvals.reference_id'
                }
            },
            details: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ReimbursementDetail,
                join: {
                    from: 'reimbursements.id',
                    to: 'reimbursement_details.reimbursement_id'
                }
            },
            attachments: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ReimbursementAttachment,
                join: {
                    from: 'reimbursements.id',
                    to: 'reimbursement_attachments.reimbursement_id'
                }
            }
        };
    }
}

module.exports = Reimbursement;