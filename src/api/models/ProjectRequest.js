const { BaseModelBooking } = require('../../config/database');

class ProjectRequest extends BaseModelBooking {
    static get tableName() {
        return 'project_requests';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['document_number', 'user_id', 'cab_id', 'dept_id'],
            properties: {
                id: { type: 'integer' },
                document_number: { type: 'string', maxLength: 100 },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                dept_id: { type: 'integer' },
                problem_description: { type: 'string' },
                root_cause: { type: 'string' },
                corrective_action: { type: 'string' },
                status: {
                    type: 'string',
                    enum: ['WAITING_APPROVAL', 'WAITING_GA', 'IN_PROGRESS', 'WAITING_VERIFICATION', 'REVISION', 'CLOSED', 'REJECTED']
                },
                request_date: { type: 'string', format: 'date-time' },
                completion_date: { type: 'string', format: 'date-time', nullable: true },
                is_active: { type: 'integer', default: 1 }
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const Department = require('./Department');
        const Approval = require('./Approval');
        const ProjectProgress = require('./ProjectProgress');
        const ProjectAttachment = require('./ProjectAttachment');

        return {
            requester: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'project_requests.user_id',
                    to: 'tb_user.id_user'
                }
            },
            department: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Department,
                join: {
                    from: 'project_requests.dept_id',
                    to: 'tb_dept.id_dept'
                }
            },
            approvals: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: Approval,
                filter: query => query
                    .where('module_name', 'PROJECT_REQUEST')
                    .orderBy('approval_order', 'asc'),
                join: {
                    from: 'project_requests.id',
                    to: 'approvals.reference_id'
                }
            },
            progress_timeline: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ProjectProgress,
                join: {
                    from: 'project_requests.id',
                    to: 'project_progress.request_id'
                }
            },
            attachments: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ProjectAttachment,
                join: {
                    from: 'project_requests.id',
                    to: 'project_attachments.request_id'
                }
            }
        };
    }
}

module.exports = ProjectRequest;