const BaseRepository = require('./base.repository');
const InventoryCategory = require('../models/InventoryCategory');

class InventoryCategoryRepository extends BaseRepository {
    constructor() {
        super(InventoryCategory);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = InventoryCategory.query()
            .select('*')
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`)
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
        const query = InventoryCategory.query()
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
        return InventoryCategory.query().findById(id).withGraphFetched(relations);
    }

}

module.exports = new InventoryCategoryRepository();