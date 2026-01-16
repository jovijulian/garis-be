const { BaseModelBooking } = require('../../config/database');

class TransportOrder extends BaseModelBooking {
    static get tableName() {
        return 'transport_orders';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'cab_id', 'origin', 'destination', 'date', 'time', 'transport_type_id'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                transport_type_id: { type: 'integer' },
                origin: { type: 'string' },
                origin_detail: { type: 'string', nullable: true },
                destination: { type: 'string' },
                destination_detail: { type: 'string', nullable: true },
                date: { type: 'string' },
                time: { type: 'string' },
                total_pax: { type: 'integer', nullable: true },
                transport_class: { type: 'string', nullable: true },
                preferred_provider: { type: 'string', nullable: true },
                purpose: { type: 'string', nullable: true },
                note: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Canceled'] },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const User = require('./User');
        const TransportType = require('./TransportType');
        const TransportPassenger = require('./TransportPassenger');

        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: { from: 'transport_orders.cab_id', to: 'tb_cab.id_cab' }
            },
            transport_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: TransportType,
                join: {
                    from: 'transport_orders.transport_type_id',
                    to: 'transport_types.id'
                }
            },
            passengers: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: TransportPassenger,
                join: { from: 'transport_orders.id', to: 'transport_passengers.transport_order_id' }
            },
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'transport_orders.user_id',
                    to: 'tb_user.id_user'
                }
            },
        };
    }
}

module.exports = TransportOrder;