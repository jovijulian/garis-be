const { BaseModelBooking } = require('../../config/database');

class InventoryItem extends BaseModelBooking {
    static get tableName() {
        return 'inventory_items';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['cab_id', 'category_id', 'barcode', 'name', 'item_type', 'stock_minimum', 'base_unit_id'],
            properties: {
                id: { type: 'integer' },
                cab_id: { type: 'integer' },
                category_id: { type: 'integer' },
                barcode: { type: 'string' },
                name: { type: 'string' },
                item_type: { type: 'integer' }, // 1 = BHP , 2 = pinjaman  
                stock_available: { type: 'integer' },
                stock_minimum: { type: 'integer' },
                base_unit_id: { type: 'integer' },
                pack_unit_id: { type: 'integer' },
                qty_per_pack: { type: 'integer' },
                is_active: { type: 'integer' },
                created_by: { type: 'string' },
                updated_by: { type: 'string' },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const InventoryCategory = require('./InventoryCategory');
        const InventoryUnit = require('./InventoryUnit');
        const User = require('./User');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'inventory_items.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            category: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryCategory,
                join: {
                    from: 'inventory_items.category_id',
                    to: 'inventory_categories.id'
                }
            },
            base_unit: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryUnit,
                join: {
                    from: 'inventory_items.base_unit_id',
                    to: 'inventory_units.id'
                }
            },
            pack_unit: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryUnit,
                join: {
                    from: 'inventory_items.pack_unit_id',
                    to: 'inventory_units.id'
                }
            },
            created_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_items.created_by',
                    to: 'tb_user.id_user',
                }
            },
            updated_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_items.updated_by',
                    to: 'tb_user.id_user',
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = InventoryItem;