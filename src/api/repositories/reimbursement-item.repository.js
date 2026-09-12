const BaseRepository = require('./base.repository');
const ReimbursementItem = require('../models/ReimbursementItem');

class ReimbursementItemRepository extends BaseRepository {
    constructor() {
        super(ReimbursementItem);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = ReimbursementItem.query()
            .select('*')
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'ASC')
            .orderBy('is_default', 'DESC');

        if (search) {
            query.where('item_name', 'like', `%${search}%`)
                .where('is_active', 1)

        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async options(params) {
        const query = ReimbursementItem.query()
            .select('id', 'item_name')
            .where('is_active', 1)
            .orderBy('id', 'ASC')
            .orderBy('is_default', 'DESC');

        if (params) {
            query.where('item_name', 'like', `%${params}%`)
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return ReimbursementItem.query().findById(id).withGraphFetched(relations);
    }
}

module.exports = new ReimbursementItemRepository();