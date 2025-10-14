const { BaseModelBooking } = require('../../config/database');

class VehicleType extends BaseModelBooking {
    static get tableName() {
        return 'vehicle_types';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
            }
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = VehicleType;