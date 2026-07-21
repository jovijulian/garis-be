const { BaseModelBooking } = require('../../config/database');

class ProjectProgress extends BaseModelBooking {
    static get tableName() {
        return 'project_progress';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['request_id', 'user_id', 'title', 'progress_type'],
            properties: {
                id: { type: 'integer' },
                request_id: { type: 'integer' },
                user_id: { type: 'string' },
                title: { type: 'string', maxLength: 255 },
                description: { type: 'string' },
                progress_type: { 
                    type: 'string', 
                    enum: ['UPDATE_GA', 'REVISION_USER', 'CLOSE_COMMENT_USER'] 
                }
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const ProjectAttachment = require('./ProjectAttachment');

        return {
            actor: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'project_progress.user_id',
                    to: 'tb_user.id_user'
                }
            },
            attachments: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ProjectAttachment,
                join: {
                    from: 'project_progress.id',
                    to: 'project_attachments.progress_id'
                }
            }
        };
    }
}

module.exports = ProjectProgress;