const { BaseModelBooking } = require('../../config/database');

class AccommodationGuest extends BaseModelBooking {
    static get tableName() {
        return 'accommodation_guests';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['guest_name', 'gender'],
            properties: {
                id: { type: 'integer' },
                accommodation_order_id: { type: 'integer' },
                guest_name: { type: 'string' },
                gender: { type: 'string', enum: ['Laki-laki', 'Perempuan'] },
            }
        };
    }
}

module.exports = AccommodationGuest;