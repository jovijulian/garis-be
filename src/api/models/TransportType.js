const { BaseModelBooking } = require('../../config/database');

class TransportType extends BaseModelBooking {
    static get tableName() {
        return 'transport_types';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                is_active: { type: 'integer', default: 1 }
            }
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = TransportType;