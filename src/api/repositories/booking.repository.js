const BaseRepository = require('./base.repository');
const Booking = require('../models/Booking');
const { knexConnection } = require('../../config/database');
const User = require('../models/User');
const Room = require('../models/Room');
const OrderAmenity = require('../models/OrderAmenity');

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    async findAllWithFilters(queryParams = {}, siteId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Booking.query()
            .select('*')
            .withGraphFetched('[user, room, amenities]')
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('amenities', builder => {
                builder.select('amenities.id as id', 'amenities.name');
            })
            .page(page - 1, per_page)
            .orderBy('start_time', 'DESC');

        if (siteId) {
            query.whereExists(
                Booking.relatedQuery('room')
                    .where('cab_id', siteId)
            );
        }
        if (search) {
            query.where(builder => {
                builder.where('purpose', 'like', `%${search}%`)
                    // .orWhereExists(
                    //     Booking.relatedQuery('user')
                    //         .where('nama_user', 'like', `%${search}%`)
                    // )
                    .orWhereExists(
                        Booking.relatedQuery('room')
                            .where('name', 'like', `%${search}%`)
                    );
            });
        }

        const paginatedResult = await query;

        // const resultsWithBooleanConflict = paginatedResult.results.map(booking => ({
        //     ...booking,
        //     is_conflicting: !!booking.is_conflicting
        // }));

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async createAmenities(payload, trx) {
        if (!payload || payload.length === 0) return;
        return OrderAmenity.query(trx).insert(payload);
    }

    async deleteAmenitiesByBookingId(bookingId, trx) {
        return OrderAmenity.query(trx).where('booking_id', bookingId).delete();
    }

    async findAllWithFiltersByUserId(queryParams = {}, id_user) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Booking.query()
            .select('*')
            .withGraphFetched('[user, room, amenities]')
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('amenities', builder => {
                builder.select('amenities.id as id', 'amenities.name');
            })

            .where('id_user', id_user)
            .page(page - 1, per_page)
            .orderBy('start_time', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('id_user', 'like', `%${search}%`)
                    .orWhere('room_id', 'like', `%${search}%`)

                    .orWhereExists(
                        User.relatedQuery('user')
                            .where('nama_user', 'like', `%${search}%`)
                    )

                    .orWhereExists(
                        Room.relatedQuery('room')
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



    // async findApprovedConflicts(roomId, date, startTime, endTime, trx) {
    //     const query = Booking.query(trx)
    //         .where('room_id', roomId)
    //         .andWhere('booking_date', date)
    //         .andWhere('status', 'Approved')
    //         .andWhere(builder => {
    //             builder.where('start_time', '<', endTime)
    //                 .andWhereRaw('ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60)) > ?', [startTime]);
    //         });
    //     return query;
    // }

    async findConflicts(roomId, startTime, endTime, bookingIdToExclude = null, trx) {
        const query = Booking.query(trx)
            .where('room_id', roomId)
            .where(builder => {
                builder.where('start_time', '<', endTime)
                    .andWhere('end_time', '>', startTime);
            });

        if (bookingIdToExclude) {
            query.where('id', '!=', bookingIdToExclude);
        }

        return query;
    }

    async findSubmitConflicts(roomId, startTime, endTime, bookingIdToExclude = null, trx) {
        const query = Booking.query(trx)
            .where('room_id', roomId)
            .where(builder => {
                builder.where('start_time', '<', endTime)
                    .andWhere('end_time', '>', startTime);
            });

        if (bookingIdToExclude) {
            query.where('id', '!=', bookingIdToExclude);
        }

        return query;
    }

    async findApprovedConflicts(roomId, startTime, endTime, bookingIdToExclude = null, trx) {
        const query = Booking.query(trx)
            .where('room_id', roomId)
            .andWhere('status', 'Approved')
            .where(builder => {
                builder.where('start_time', '<', endTime)
                    .andWhere('end_time', '>', startTime);
            });

        if (bookingIdToExclude) {
            query.where('id', '!=', bookingIdToExclude);
        }

        return query;
    }

    async updateStatus(bookingId, status, trx) {
        return Booking.query(trx)
            .patchAndFetchById(bookingId, { status });
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return Booking.query().findById(id).withGraphFetched(relations);
    }

    async findFirstApprovedConflict(roomId, startTime, endTime, trx) {
        const query = this.model.query(trx)
            .where('room_id', roomId)
            .whereIn('status', ['Submit', 'Approved'])
            .andWhere(builder => {
                builder.where('start_time', '<', endTime)
                    .andWhere('end_time', '>', startTime);
            })
            .withGraphFetched('user(selectUsername)')
            .modifiers({
                selectUsername: builder => builder.select('nama_user')
            })
            .first();

        return query;
    }

    async markAsConflicting(bookingIds, trx) {
        if (!bookingIds || bookingIds.length === 0) return;
        
        return this.model.query(trx)
            .whereIn('id', bookingIds)
            .patch({ is_conflicting: 1 });
    }
}

module.exports = new BookingRepository();