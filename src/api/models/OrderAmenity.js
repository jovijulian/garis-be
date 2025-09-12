const { BaseModelBooking } = require('../../config/database');

class OrderAmenity extends BaseModelBooking {
    static get tableName() {
        return 'order_aminities';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['amenity_id', 'booking_id'],
            properties: {
                id: { type: 'integer' },
                amenity_id: { type: 'integer' },
                booking_id: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const Booking = require('./Booking');
        const Amenity = require('./Amenity');
        return {
            booking: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Booking,
                join: {
                    from: 'order_aminities.booking_id',
                    to: 'bookings.id'
                }
            },
            amenity: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Amenity,
                join: {
                    from: 'order_aminities.amenity_id',
                    to: 'amenities.id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = OrderAmenity;