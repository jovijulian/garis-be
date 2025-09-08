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
            .whereNull('deleted_at')

            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`),
                query.orWhere('email', 'like', `%${search}%`);
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

    async findByEmail(email) {
        return User.query().where({ email }).first();
    }

    async findByUserId(id_user) {
        return User.query().where({ id_user }).first();
    }

    async updateUser(id, data, trx = null) {
        return this.model.query(trx).update(data).where('id_user', id);
    }


}

module.exports = new UserRepository();