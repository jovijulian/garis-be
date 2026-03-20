const { BaseModelBooking } = require('../../config/database');

class InventoryCategory extends BaseModelBooking {
    static get tableName() {
        return 'inventory_categories';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                is_active: { type: 'integer' }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = InventoryCategory;