const BaseRepository = require('./base.repository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findAllWithFilters(queryParams = {}, company_id) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = User.query()
            .select('*')
            // .withGraphFetched('[relation_name]')
            // .modifyGraph('[relation_name]', builder => {
            //     builder.select('[field_name]', '[field_name]');
            // }) if relation
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('agent_station', 'like', `%${search}%`)
                // .orWhereExists(
                //     User.relatedQuery('[relation_name]')
                //         .where('[field_name]', 'like', `%${search}%`)
                // ); if relation
            });
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return User.query().findById(id).withGraphFetched(relations);
    }


}

module.exports = new UserRepository();