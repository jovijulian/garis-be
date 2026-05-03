const BaseRepository = require('./base.repository');
const InventoryTransaction = require('../models/InventoryTransaction');

class InventoryTransactionRepository extends BaseRepository {
    constructor() {
        super(InventoryTransaction);
    }

    async findAllWithFilters(queryParams = {}, cabId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = InventoryTransaction.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, unit, created_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('item', builder => {
                builder.select('id', 'name', 'barcode', 'item_type');
            })
            .modifyGraph('item.base_unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (cabId) {
            query.where('inventory_transactions.cab_id', cabId);
        }

        if (queryParams.item_id) {
            query.where('inventory_transactions.item_id', queryParams.item_id);
        }

        if (queryParams.nik) {
            query.where('inventory_transactions.nik', queryParams.nik);
        }

        if (queryParams.transaction_type) {
            query.where('inventory_transactions.transaction_type', queryParams.transaction_type);
        }

        if (search) {
            query.where(builder => {
                builder.where('inventory_transactions.nik', 'like', `%${search}%`)
                    .orWhereIn('inventory_transactions.item_id', function () {
                        this.select('id').from('inventory_items').where('name', 'like', `%${search}%`);
                    });
            });
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: Number(page),
            per_page: Number(per_page),
        };
    }

    async options(params) {
        const query = InventoryTransaction.query()
            .select('id', 'name')
            .where('is_active', 1)

        if (params) {
            query.where('name', 'like', `%${params}%`)
                .orWhere('location', 'like', `%${params}%`)

        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return InventoryTransaction.query().findById(id).withGraphFetched(relations);
    }

    async findAllWithFiltersUser(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = InventoryTransaction.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, unit, created_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('item', builder => {
                builder.select('id', 'name', 'barcode', 'item_type');
            })
            .modifyGraph('item.base_unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (userId) {
            query.where('inventory_transactions.created_by', userId);
        }

        if (queryParams.item_id) {
            query.where('inventory_transactions.item_id', queryParams.item_id);
        }

        if (queryParams.nik) {
            query.where('inventory_transactions.nik', queryParams.nik);
        }

        if (queryParams.transaction_type) {
            query.where('inventory_transactions.transaction_type', queryParams.transaction_type);
        }

        if (search) {
            query.where(builder => {
                builder.where('inventory_transactions.nik', 'like', `%${search}%`)
                    .orWhereIn('inventory_transactions.item_id', function () {
                        this.select('id').from('inventory_items').where('name', 'like', `%${search}%`);
                    });
            });
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: Number(page),
            per_page: Number(per_page),
        };
    }


}

module.exports = new InventoryTransactionRepository();