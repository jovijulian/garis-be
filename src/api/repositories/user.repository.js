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
            .page(page - 1, per_page)
            .orderBy('id_user', 'DESC');

        if (search) {
            query.where('nama_user', 'like', `%${search}%`),
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
        return User.query().where({ id_user })
            .withGraphFetched('[permissions]')
            .first();
    }

    async updateUser(id, data, trx = null) {
        return this.model.query(trx).update(data).where('id_user', id);
    }

    async findAdminsBySiteId(siteId) {
        const users = await User.query()
            .withGraphFetched('employee')
            .modifyGraph('employee', builder => {
                builder.select('email');
            })
            .where('role_garis', 2)
            .whereExists(
                User.relatedQuery('permissions')
                    .where('cab_id', siteId)
            );

        return users
            .filter(user => user.employee && user.employee.email)
            .map(user => ({
                email: user.employee.email
            }));
    }

    async options(params) {
        const query = User.query()
            .select('*')


        if (params) {
            query.where('nama_user', 'like', `%${params}%`)
        }

        const data = await query;
        return data;
    }

    async findDriverByIdUser(id_user) {
        return User.query()
            .select('*')
            .where('id_user', id_user)
            .where('role_garis', 3)
            .withGraphFetched('employee')
            .modifyGraph('employee', builder => {
                builder.select('email');
            })
            .first();
    }

    async findEmailUser(id_user) {
        return User.query()
            .findById(id_user)
            .withGraphFetched('employee')
            .modifyGraph('employee', builder => {
                builder.select('email');
            })
            .select('id_user', 'nama_user');
    }


}

module.exports = new UserRepository();