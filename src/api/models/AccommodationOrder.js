const { BaseModelBooking } = require('../../config/database');

class AccommodationOrder extends BaseModelBooking {
    static get tableName() {
        return 'accommodation_orders';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'cab_id', 'check_in_date', 'check_out_date'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                check_in_date: { type: 'string' },
                check_out_date: { type: 'string' },
                room_needed: { type: 'string', nullable: true },
                total_pax: { type: 'integer', nullable: true },
                total_male: { type: 'integer', nullable: true },
                total_female: { type: 'integer', nullable: true },
                note: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Canceled'] },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const User = require('./User');
        const AccommodationGuest = require('./AccommodationGuest');

        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: { from: 'accommodation_orders.cab_id', to: 'tb_cab.id_cab' }
            },
            guests: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: AccommodationGuest,
                join: { from: 'accommodation_orders.id', to: 'accommodation_guests.accommodation_order_id' }
            },
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'accommodation_orders.user_id',
                    to: 'tb_user.id_user'
                }
            },
        };
    }
}

module.exports = AccommodationOrder;