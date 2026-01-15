const BaseRepository = require('./base.repository');
const TransportType = require('../models/TransportType');

class TransportTypeRepository extends BaseRepository {
    constructor() {
        super(TransportType);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = TransportType.query()
            .select('*')
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`);
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
        const query = TransportType.query()
            .select('id', 'name')

        if (params) {
            query.where('name', 'like', `%${params}%`)
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return TransportType.query().findById(id).withGraphFetched(relations);
    }
}

module.exports = new TransportTypeRepository();