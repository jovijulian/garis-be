const { BaseModelBooking } = require('../../config/database');

class ConsumptionType extends BaseModelBooking {
    static get tableName() {
        return 'consumption_types';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                description: { type: 'string' },
                is_active: { type: 'integer' }
            }
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = ConsumptionType;