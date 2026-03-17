const { BaseModelBooking } = require('../../config/database');

class ReminderType extends BaseModelBooking {
    static get tableName() {
        return 'reminder_types';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'notification_intervals'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                notification_intervals: { type: 'string' },
                is_active: { type: 'integer' }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = ReminderType;