const { BaseModelBooking } = require('../../config/database');

class InventoryTransaction extends BaseModelBooking {
    static get tableName() {
        return 'inventory_transactions';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['cab_id', 'item_id', 'nik', 'created_by', 'transaction_type', 'input_qty', 'input_unit_id', 'qty'],
            properties: {
                id: { type: 'integer' },
                cab_id: { type: 'integer' },
                item_id: { type: 'integer' },
                created_by: { type: 'string' },
                nik: { type: 'string', nullable: true },
                transaction_type: { type: 'string', enum: ['STOCK_IN', 'OUT_BHP', 'OUT_ASSET', 'RETURN'] },
                input_qty: { type: 'integer' },
                input_unit_id: { type: 'integer' },
                qty: { type: 'integer' },
                note: { type: 'string', nullable: true },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const InventoryItem = require('./InventoryItem');
        const InventoryUnit = require('./InventoryUnit');
        const User = require('./User');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'inventory_transactions.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            item: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryItem,
                join: {
                    from: 'inventory_transactions.item_id',
                    to: 'inventory_items.id'
                }
            },
            unit: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryUnit,
                join: {
                    from: 'inventory_transactions.input_unit_id',
                    to: 'inventory_units.id'
                }
            },
            created_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_transactions.created_by',
                    to: 'tb_user.id_user',
                }
            },
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = InventoryTransaction;