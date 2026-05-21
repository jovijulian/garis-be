
const { BaseModelBooking } = require('../../config/database');

class InventoryLoan extends BaseModelBooking {
    static get tableName() {
        return 'inventory_loans';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['cab_id', 'transaction_id', 'item_id', 'created_by', 'qty_borrowed', 'qty_returned', 'status', 'user_id'],
            properties: {
                id: { type: 'integer' },
                transaction_id: { type: 'integer' },
                cab_id: { type: 'integer' },
                item_id: { type: 'integer' },
                created_by: { type: 'string' },
                nik: { type: 'string', nullable: true },
                qty_borrowed: { type: 'integer' },
                qty_returned: { type: 'integer' },
                status: { type: 'string', enum: ['BORROWED', 'RETURNED', 'PARTIAL_RETURNED'] },
                borrowed_at: { type: 'string'},
                returned_at: { type: 'string'},
                user_id: { type: 'string', nullable: true },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const InventoryTransaction = require('./InventoryTransaction');
        const InventoryItem = require('./InventoryItem');
        const ItemUom = require('./ItemUom');
        const User = require('./User');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'inventory_loans.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            transaction: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryTransaction,
                join: {
                    from: 'inventory_loans.transaction_id',
                    to: 'inventory_transactions.id'
                }
            },
            item: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: InventoryItem,
                join: {
                    from: 'inventory_loans.item_id',
                    to: 'inventory_items.id'
                }
            },
            uoms: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: ItemUom,
                join: { from: 'inventory_loans.item_id', to: 'item_uoms.item_id' }
            },
            created_by_user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_loans.created_by',
                    to: 'tb_user.id_user',
                }
            },
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_loans.user_id',
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

module.exports = InventoryLoan;