const { BaseModelBooking } = require('../../config/database');

class ProjectAttachment extends BaseModelBooking {
    static get tableName() {
        return 'project_attachments';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['file_url', 'file_name'],
            properties: {
                id: { type: 'integer' },
                request_id: { type: 'integer', nullable: true },
                progress_id: { type: 'integer', nullable: true },
                file_url: { type: 'string', maxLength: 255 },
                file_name: { type: 'string', maxLength: 255 },
                file_type: { type: 'string', maxLength: 50, nullable: true }
            }
        };
    }
}

module.exports = ProjectAttachment;