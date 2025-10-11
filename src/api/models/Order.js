const { BaseModelBooking } = require('../../config/database');

class Order extends BaseModelBooking {
    static get tableName() {
        return 'orders';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'purpose', 'pax', 'order_date'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                booking_id: { type: 'integer', nullable: true },
                room_id: { type: 'integer', nullable: true },
                location_text: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled'] },
                pax: { type: 'integer' },
                order_date: { type: 'string', format: 'date' },
                note: { type: 'string', nullable: true },
                approved_by: { type: 'string', nullable: true },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const User = require('./User');
        const Booking = require('./Booking');
        const Room = require('./Room');
        const OrderDetail = require('./OrderDetail');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'orders.cab_id',
                    to: 'tb_cab.id_cab'
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
            details: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: OrderDetail,
                join: {
                    from: 'orders.id',
                    to: 'order_details.order_id'
                }
            }
            
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Order;