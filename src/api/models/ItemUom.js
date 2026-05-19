const { BaseModelBooking } = require('../../config/database');

class ItemUom extends BaseModelBooking {
    static get tableName() {
        return 'item_uoms';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['item_id', 'unit_id', 'multiplier'],
            properties: {
                id: { type: 'integer' },
                item_id: { type: 'integer' },
                unit_id: { type: 'integer' },
                multiplier: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const InventoryUnit = require('./InventoryUnit');
        const InventoryItem = require('./InventoryItem');
        return {
            unit: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryUnit,
                join: {
                    from: 'item_uoms.unit_id',
                    to: 'inventory_units.id'
                }
            },
            item: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryItem,
                join: {
                    from: 'item_uoms.item_id',
                    to: 'inventory_items.id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = ItemUom;