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
        const secondDB = process.env.DB_SECOND_NAME;
        const startDate = queryParams.start_date || '';
        const endDate = queryParams.end_date || '';

        const query = InventoryTransaction.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, unit, created_by_user, user.[employee]]')
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
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user')
                    .withGraphFetched('employee')
                    .modifyGraph('employee', empBuilder => {
                        empBuilder.select('id_karyawan', 'nama', 'nik', 'no_ktp');
                    });
            })
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (cabId) {
            query.where('inventory_transactions.cab_id', cabId);
        }

        if (queryParams.item_id) {
            query.where('inventory_transactions.item_id', queryParams.item_id);
        }

        if (queryParams.user_id) {
            query.where('inventory_transactions.user_id', queryParams.user_id);

        }

        if (queryParams.transaction_type) {
            query.where('inventory_transactions.transaction_type', queryParams.transaction_type);
        }

        if (startDate && endDate) {
            query.whereBetween('inventory_transactions.created_at',  [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        }

        if (search) {
            query.where(builder => {
                builder.whereIn('inventory_transactions.user_id', function () {
                    this.select('nik')
                        .from(`${secondDB}.tb_karyawan`)
                        .where('no_ktp', 'like', `%${search}%`)
                        .orWhere('nama', 'like', `%${search}%`)
                        .orWhere('nik', 'like', `%${search}%`);
                })
                    .orWhereIn('inventory_transactions.user_id', function () {
                        this.select('nik')
                            .from(`${secondDB}.tb_karyawan`)
                            .where('no_ktp', 'like', `%${search}%`)
                            .orWhere('nama', 'like', `%${search}%`)
                            .orWhere('nik', 'like', `%${search}%`);
                    })
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
        const secondDB = process.env.DB_SECOND_NAME
        const query = InventoryTransaction.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, unit, created_by_user, user.[employee]]')
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
            query.where('inventory_transactions.created_by', userId)
                .orWhere('inventory_transactions.user_id', userId);
        }

        if (queryParams.item_id) {
            query.where('inventory_transactions.item_id', queryParams.item_id);
        }

        if (queryParams.user_id) {
            query.where('inventory_transactions.user_id', queryParams.user_id);
        }

        if (queryParams.transaction_type) {
            query.where('inventory_transactions.transaction_type', queryParams.transaction_type);
        }

        if (search) {
            query.where(builder => {
                builder.whereIn('inventory_transactions.user_id', function () {
                    this.select('nik')
                        .from(`${secondDB}.tb_karyawan`)
                        .where('no_ktp', 'like', `%${search}%`)
                        .orWhere('nama', 'like', `%${search}%`)
                        .orWhere('nik', 'like', `%${search}%`);
                })
                    .orWhereIn('inventory_transactions.user_id', function () {
                        this.select('nik')
                            .from(`${secondDB}.tb_karyawan`)
                            .where('no_ktp', 'like', `%${search}%`)
                            .orWhere('nama', 'like', `%${search}%`)
                            .orWhere('nik', 'like', `%${search}%`);
                    })
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

    async findAllForExport(queryParams = {}, cabId = null) {
        const { startDate, endDate, transaction_type, item_id, user_id, search } = queryParams;
        const secondDB = process.env.DB_SECOND_NAME;
    
        const query = InventoryTransaction.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, unit, created_by_user, user.[employee]]')
            .modifyGraph('cabang', builder => builder.select('id_cab', 'nama_cab'))
            .modifyGraph('item', builder => builder.select('id', 'name', 'barcode', 'item_type'))
            .modifyGraph('item.base_unit', builder => builder.select('id', 'name'))
            .modifyGraph('unit', builder => builder.select('id', 'name'))
            .modifyGraph('created_by_user', builder => builder.select('id_user', 'nama_user'))
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user')
                    .withGraphFetched('employee')
                    .modifyGraph('employee', empBuilder => empBuilder.select('id_karyawan', 'nama', 'nik'));
            })
            .orderBy('created_at', 'DESC');
    
        if (cabId) {
            query.where('inventory_transactions.cab_id', cabId);
        }
    
        if (startDate && endDate) {
            query.whereBetween('inventory_transactions.created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);
        }
    
        if (transaction_type) {
            query.where('inventory_transactions.transaction_type', transaction_type);
        }
        if (item_id) {
            query.where('inventory_transactions.item_id', item_id);
        }
        if (user_id) {
            query.where('inventory_transactions.user_id', user_id);
        }
    
        if (search) {
            query.where(builder => {
                builder.whereIn('inventory_transactions.user_id', function () {
                    this.select('nik').from(`${secondDB}.tb_karyawan`)
                        .where('nama', 'like', `%${search}%`)
                        .orWhere('nik', 'like', `%${search}%`);
                }).orWhereIn('inventory_transactions.item_id', function () {
                    this.select('id').from('inventory_items').where('name', 'like', `%${search}%`);
                });
            });
        }
    
        return await query;
    }


}

module.exports = new InventoryTransactionRepository();