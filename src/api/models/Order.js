const { BaseModelBooking } = require('../../config/database');

class Order extends BaseModelBooking {
    static get tableName() {
        return 'orders';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'consumption_type_id', 'pax', 'order_time'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                booking_id: { type: 'integer', nullable: true },
                room_id: { type: 'integer', nullable: true },
                location_text: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled'] },
                consumption_type_id: { type: 'integer' },
                pax: { type: 'integer' },
                order_time: { type: 'string', format: 'date-time' },
                menu_description: { type: 'string', nullable: true },
                approved_by: { type: 'string', nullable: true },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const ConsumptionType = require('./ConsumptionType');
        const User = require('./User');
        const Booking = require('./Booking');
        const Room = require('./Room');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'orders.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            consumption_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: ConsumptionType,
                join: {
                    from: 'orders.consumption_type_id',
                    to: 'consumption_types.id'
                }
            },
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'orders.user_id',
                    to: 'tb_user.id_user'
                }
            },
            booking: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Booking,
                join: {
                    from: 'orders.booking_id',
                    to: 'bookings.id'
                }
            },
            room: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Room,
                join: {
                    from: 'orders.room_id',
                    to: 'rooms.id'
                }
            },
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Order;