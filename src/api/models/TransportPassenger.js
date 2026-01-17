const { BaseModelBooking } = require('../../config/database');

class TransportPassenger extends BaseModelBooking {
    static get tableName() {
        return 'transport_passengers';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['passenger_name', 'transport_order_id'],
            properties: {
                id: { type: 'integer' },
                transport_order_id: { type: 'integer' },
                passenger_name: { type: 'string' },
                phone_number: { type: 'string', nullable: true },
            }
        };
    }
}

module.exports = TransportPassenger;