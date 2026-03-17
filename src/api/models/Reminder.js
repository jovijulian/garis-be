const { BaseModelBooking } = require('../../config/database');

class Reminder extends BaseModelBooking {
    static get tableName() {
        return 'reminders';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['reminder_type_id', 'title', 'cab_id', 'due_date'],
            properties: {
                id: { type: 'integer' },
                reminder_type_id: { type: 'integer' },
                title: { type: 'string' },
                cab_id: { type: 'integer' },
                due_date: { type: 'string' },
                is_active: { type: 'integer' },
                status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'OVERDUE'] },
                created_by: { type: 'string' },
                updated_by: { type: 'string' },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const ReminderType = require('./ReminderType');
        const User = require('./User');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'reminders.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            reminder_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: ReminderType,
                join: {
                    from: 'reminders.reminder_type_id',
                    to: 'reminder_types.id'
                }
            },
            created_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'reminders.created_by',
                    to: 'tb_user.id_user',
                }
            },
            updated_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'reminders.updated_by',
                    to: 'tb_user.id_user',
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Reminder;