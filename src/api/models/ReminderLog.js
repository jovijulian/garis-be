const { BaseModelBooking } = require('../../config/database');

class ReminderLog extends BaseModelBooking {
    static get tableName() {
        return 'reminder_logs';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['reminder_id', 'days_before', 'sent_at'],
            properties: {
                id: { type: 'integer' },
                reminder_id: { type: 'integer' },
                days_before: { type: 'integer' },
                sent_at: { type: 'string' }
            }
        };
    }

    static get relationMappings() {
        const Reminder = require('./Reminder');

        return {
            reminder: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Reminder,
                join: {
                    from: 'reminder_logs.reminder_id',
                    to: 'reminders.id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = ReminderLog;