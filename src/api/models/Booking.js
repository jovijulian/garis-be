const { Model } = require('../../config/database');

class Booking extends Model {
    static get tableName() {
        return 'bookings';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'room_id', 'purpose', 'booking_date', 'start_time', 'duration_minutes'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'integer' },
                room_id: { type: 'integer' },
                purpose: { type: 'string' },
                booking_date: { type: 'string' },
                start_time: { type: 'string' },
                duration_minutes: { type: 'integer' },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected'], default: 'Submit' },
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const Room = require('./Room');

        return {
            user: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'bookings.user_id',
                    to: 'users.id',
                },
            },
            room: {
                relation: Model.BelongsToOneRelation,
                modelClass: Room,
                join: {
                    from: 'bookings.room_id',
                    to: 'rooms.id',
                },
            },
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Booking;