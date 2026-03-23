
const { BaseModelBooking } = require('../../config/database');

class InventoryLoan extends BaseModelBooking {
    static get tableName() {
        return 'inventory_loans';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['cab_id', 'transaction_id', 'item_id', 'user_id', 'qty_borrowed', 'qty_returned', 'status'],
            properties: {
                id: { type: 'integer' },
                transaction_id: { type: 'integer' },
                cab_id: { type: 'integer' },
                item_id: { type: 'integer' },
                user_id: { type: 'string' },
                qty_borrowed: { type: 'integer' },
                qty_returned: { type: 'integer' },
                status: { type: 'string', enum: ['BORROWED', 'RETURNED', 'PARTIAL_RETURNED'] },
                borrowed_at: { type: 'string'},
                returned_at: { type: 'string'},
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const InventoryTransaction = require('./InventoryTransaction');
        const InventoryItem = require('./InventoryItem');
        const InventoryUnit = require('./InventoryUnit');
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
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'inventory_loans.user_id',
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

module.exports = InventoryLoan;