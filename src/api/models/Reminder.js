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
                reminder_code: { type: 'string' }, 
                parent_id: { type: 'integer', nullable: true }, 
                extension_count: { type: 'integer' }, // Berapa kali sudah diperpanjang (0 = original)
                description: { type: 'string', nullable: true }, // Keterangan tambahan
                identity_number: { type: 'string', nullable: true }, // No STNK / No Kontrak
                cost: { type: 'number', nullable: true }, // Biaya perpanjangan/pembayaran
                attachment_path: { type: 'string', nullable: true }, // File bukti bayar
                is_recurring: { type: 'integer' },
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
            },
            parent: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Reminder,
                join: { from: 'reminders.parent_id', to: 'reminders.id' }
            },
            history: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: Reminder,
                join: { from: 'reminders.id', to: 'reminders.parent_id' }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Reminder;