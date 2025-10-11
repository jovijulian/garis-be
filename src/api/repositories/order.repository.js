const BaseRepository = require('./base.repository');
const Order = require('../models/Order');
const moment = require('moment');
class OrderRepository extends BaseRepository {
    constructor() {
        super(Order);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Order.query()
            .select('*')
            .withGraphFetched('[cabang, user, booking, room]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('booking', builder => {
                builder.select('id', 'purpose', 'start_time', 'end_time');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name', 'location');
            })
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('location_text', 'like', `%${search}%`)
                    .orWhere('order_date', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)

                    .orWhereExists(
                        User.relatedQuery('user')
                            .where('nama_user', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Room.relatedQuery('room')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Site.relatedQuery('cabang')
                            .where('nama_cab', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Booking.relatedQuery('booking')
                            .where('purpose', 'like', `%${search}%`)
                    )
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

    async findAllWithFiltersByUserId(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Order.query()
            .select('*')

            .withGraphFetched('[cabang, user, booking, room]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('booking', builder => {
                builder.select('id', 'purpose', 'start_time', 'end_time');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name', 'location');
            })
            .where('user_id', userId)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('location_text', 'like', `%${search}%`)
                    .orWhere('order_date', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)

                    .orWhereExists(
                        User.relatedQuery('user')
                            .where('nama_user', 'like', `%${search}%`)
                    )

                    .orWhereExists(
                        Room.relatedQuery('room')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Site.relatedQuery('cabang')
                            .where('nama_cab', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Booking.relatedQuery('booking')
                            .where('purpose', 'like', `%${search}%`)
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

    async options(params, site) {
        const query = Room.query()
            .select('id', 'name', 'capacity', 'location', 'cab_id')
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .where('is_active', 1)

        if (site) {
            query.where('cab_id', site)
        }

        if (params) {
            query.where('name', 'like', `%${params}%`)
                .orWhere('location', 'like', `%${params}%`)
            // .orWhereExists(
            //     Room.relatedQuery('cabang')
            //         .where('nama_cab', 'like', `%${params}%`)
            // )
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return Order.query().findById(id).withGraphFetched(relations);
    }

    async findAllForExport(queryParams = {}) {
        const { startDate, endDate, status } = queryParams;

        const query = Order.query()
            .select('*')
            .withGraphFetched('[cabang, user, booking, room, details.[consumption_type]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('booking', builder => {
                builder.select('id', 'purpose', 'start_time', 'end_time');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name', 'location');
            })
            .modifyGraph('details', builder => {
                builder.select('id', 'order_id', 'consumption_type_id', 'menu', 'qty', 'delivery_time')
                    .modifyGraph('consumption_type', b => {
                        b.select('id', 'name');
                    });
            })
            .orderBy('id', 'DESC');



        if (startDate && endDate) {
            query.whereBetween('orders.order_time', [startDate, endDate]);
        }

        if (status) {
            query.where('orders.status', status);
        }

        return query
    }


}

module.exports = new OrderRepository();