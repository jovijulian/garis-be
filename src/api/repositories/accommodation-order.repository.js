const BaseRepository = require('./base.repository');
const AccommodationOrder = require('../models/AccommodationOrder');
class AccommodationOrderRepository extends BaseRepository {
    constructor() {
        super(AccommodationOrder);
    }

    async findAllWithFilters(queryParams = {}, siteId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = AccommodationOrder.query()
            .select('*')
            .withGraphFetched('[cabang, user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('note', 'like', `%${search}%`)
                    .orWhere('room_needed', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
            });

        }
        if (siteId) {
            query.where('cab_id', siteId);
        }



        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async findAllWithFiltersByUserId(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = AccommodationOrder.query()
            .select('*')

            .withGraphFetched('[cabang, user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .where('is_active', 1)
            .where('user_id', userId)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('note', 'like', `%${search}%`)
                    .orWhere('room_needed', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
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
        return AccommodationOrder.query().findById(id).withGraphFetched(relations);
    }

    async findAllForExport(queryParams = {}) {
        const { startDate, endDate, status } = queryParams;
    
        const query = AccommodationOrder.query() 
            .select('*')
            .withGraphFetched('[cabang, user, guests]') 
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .where('is_active', 1)
            .orderBy('id', 'DESC');
    
        if (startDate && endDate) {
            query.whereBetween('check_in_date', [startDate, endDate]);
        }
    
        if (status) {
            query.where('status', status);
        }
    
        return query;
    }

}

module.exports = new AccommodationOrderRepository();