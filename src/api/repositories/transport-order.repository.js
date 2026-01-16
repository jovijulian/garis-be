const BaseRepository = require('./base.repository');
const TransportOrder = require('../models/TransportOrder');
class TransportOrderRepository extends BaseRepository {
    constructor() {
        super(TransportOrder);
    }

    async findAllWithFilters(queryParams = {}, siteId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = TransportOrder.query()
            .select('*')
            .withGraphFetched('[cabang, user, transport_type]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('transport_type', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('purpose', 'like', `%${search}%`)
                    .orWhere('origin', 'like', `%${search}%`)
                    .orWhere('origin_detail', 'like', `%${search}%`)
                    .orWhere('destination', 'like', `%${search}%`)
                    .orWhere('destination_detail', 'like', `%${search}%`)
                    .orWhere('transport_class', 'like', `%${search}%`)
                    .orWhere('preferred_provider', 'like', `%${search}%`)
                    .orWhereExists(
                        TransportOrder.relatedQuery('transport_type')
                            .where('name', 'like', `%${search}%`)
                    );
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

        const query = TransportOrder.query()
            .select('*')

            .withGraphFetched('[cabang, user, transport_type]')
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
                builder.where('purpose', 'like', `%${search}%`)
                    .orWhere('origin', 'like', `%${search}%`)
                    .orWhere('origin_detail', 'like', `%${search}%`)
                    .orWhere('destination', 'like', `%${search}%`)
                    .orWhere('destination_detail', 'like', `%${search}%`)
                    .orWhere('transport_class', 'like', `%${search}%`)
                    .orWhere('preferred_provider', 'like', `%${search}%`)
                orWhereExists(
                    TransportOrder.relatedQuery('transport_type')
                        .where('name', 'like', `%${search}%`)
                );
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
        return TransportOrder.query().findById(id).withGraphFetched(relations);
    }

    async findAllForExport(queryParams = {}) {
        const { startDate, endDate, status } = queryParams;

        const query = TransportOrder.query()
            .select('*')
            .withGraphFetched('[cabang, user, passengers, transport_type]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('transport_type', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)
            .orderBy('id', 'DESC');

        if (startDate && endDate) {
            query.whereBetween('date', [startDate, endDate]);
        }

        if (status) {
            query.where('status', status);
        }

        return query;
    }

}

module.exports = new TransportOrderRepository();