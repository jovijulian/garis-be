const { BaseModelBooking } = require('../../config/database');

class Topic extends BaseModelBooking {
    static get tableName() {
        return 'topics';
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

module.exports = Topic;