const BaseRepository = require('./base.repository');
const InventoryLoan = require('../models/InventoryLoan');

class InventoryLoanRepository extends BaseRepository {
    constructor() {
        super(InventoryLoan);
    }

    async findAllWithFilters(queryParams = {}, cabId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = InventoryLoan.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, created_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('item.base_unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .whereIn('status', ['BORROWED', 'PARTIAL_RETURNED'])
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder
                    .where('nik', 'like', `%${search}%`)
                    .orWhereExists(
                        InventoryLoan.relatedQuery('item')
                            .where('name', 'like', `%${search}%`)
                    );
            });
        }
        if (cabId) {
            query.where('cab_id', cabId);
        }

        if (queryParams.nik) {
            query.where('nik', queryParams.nik);
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async getAllByNIK(nik) {
        return InventoryLoan.query()
            .select('*')
            .withGraphFetched('[cabang, item.base_unit, created_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('item.base_unit', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .where('nik', nik)
            .whereIn('status', ['BORROWED', 'PARTIAL_RETURNED'])
            .orderBy('id', 'DESC');
    }

}

module.exports = new InventoryLoanRepository();