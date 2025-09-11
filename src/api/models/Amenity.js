
const { BaseModelBooking } = require('../../config/database');

class Amenity extends BaseModelBooking {
    static get tableName() {
        return 'amenities';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                description: { type: 'string' },
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Amenity;