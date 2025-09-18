const { BaseModelBooking } = require('../../config/database');

class Booking extends BaseModelBooking {
    static get tableName() {
        return 'bookings';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['id_user', 'room_id', 'topic_id', 'purpose', 'start_time', 'end_time', 'duration_minutes'],
            properties: {
                id: { type: 'integer' },
                id_user: { type: 'string' },
                room_id: { type: 'integer' },
                topic_id: { type: 'integer' },
                purpose: { type: 'string' },
                start_time: { type: 'string' },
                end_time: { type: 'string' },
                duration_minutes: { type: 'integer' },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Canceled'], default: 'Submit' },
                notes: { type: 'string' },
                approved_by: { type: 'string' },
                is_conflicting: { type: 'integer', default: 0 },
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const Room = require('./Room');
        const Topic = require('./Topic');


        return {
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'bookings.id_user',
                    to: 'tb_user.id_user',
                },
            },
            room: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Room,
                join: {
                    from: 'bookings.room_id',
                    to: 'rooms.id',
                },
            },
            topic: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Topic,
                join: {
                    from: 'bookings.topic_id',
                    to: 'topics.id',
                },
            },
            amenities: {
                relation: BaseModelBooking.ManyToManyRelation,
                modelClass: require('./Amenity'),
                join: {
                    from: 'bookings.id',
                    through: {
                        from: 'order_aminities.booking_id',
                        to: 'order_aminities.amenity_id',
                    },
                    to: 'amenities.id',
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