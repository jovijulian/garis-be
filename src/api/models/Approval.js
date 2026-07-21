const { BaseModelBooking } = require('../../config/database');

class ProjectApproval extends BaseModelBooking {
    static get tableName() {
        return 'approvals';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['reference_id', 'module_name', 'approver_type', 'approval_order'],
            properties: {
                id: { type: 'integer' },
                reference_id: { type: 'integer' },
                module_name: { type: 'string' },
                approver_type: { type: 'string' },
                approval_order: { type: 'integer' },
                assigned_to: { type: 'string', nullable: true },
                action_by: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
                notes: { type: 'string', nullable: true },
                action_date: { type: 'string', nullable: true, format: 'date-time' }
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const ProjectRequest = require('./ProjectRequest');
        return {
            assigned_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'approvals.assigned_to',
                    to: 'tb_user.id_user'
                }
            },
            action_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'approvals.action_by',
                    to: 'tb_user.id_user'
                }
            },
            project_request: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: ProjectRequest,
                join: {
                    from: 'approvals.reference_id',
                    to: 'project_requests.id'
                }
            }
        };
    }
}

module.exports = ProjectApproval;