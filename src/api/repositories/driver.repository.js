const BaseRepository = require('./base.repository');
const Driver = require('../models/Driver');

class DriverRepository extends BaseRepository {
    constructor() {
        super(Driver);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Driver.query()
            .select('*')
            .where('is_active', 1)
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
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
        const search = params.search || '';
        const status = params.status || null;
        const cab_id = params.cab_id || null;
        const query = Driver.query()
            .select('id', 'name', 'phone_number', 'status', 'cab_id')
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .where('is_active', 1)

        if (search) {
            query.where('name', 'like', `%${params}%`)
        }

        if (status) {
            query.where('status', status);
        }
        if (cab_id) {
            query.where('cab_id', cab_id);
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return Driver.query().findById(id).withGraphFetched(relations);
    }

    async findByUserId(user_id) {
        return Driver.query().where('id_user', user_id).andWhere('is_active', 1).first();
    }

    async updateStatus(id, payload, trx = null) {
        return this.update(id, payload, trx);
    }

    async checkStatus(id) {
        const driver = await this.findById(id);
        return driver.status;
    }

}

module.exports = new DriverRepository();