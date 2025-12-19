const BaseRepository = require('./base.repository');
const Booking = require('../models/Booking');
const { knexBooking } = require('../../config/database');
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
        const startDate = queryParams.startDate || null;
        const endDate = queryParams.endDate || null;

        const query = Booking.query()
            .select('*')
            .withGraphFetched('[user(selectUsername), room(selectRoomName), topic(selectTopicName)]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user'),
                selectRoomName: builder => builder.select('id', 'name'),
                selectTopicName: builder => builder.select('id', 'name')
            })
            .where('is_active', 1)
            .orderBy('created_at', 'DESC');

        if (startDate && endDate) {
            query.whereBetween('start_time', [startDate, endDate]);
        } else {
            query.page(page - 1, per_page);
        }
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

        // return {
        //     results: paginatedResult.results,
        //     total: paginatedResult.total,
        //     page: page,
        //     per_page: per_page,
        // };

        if (!startDate && !endDate) {
            return {
                results: paginatedResult.results,
                total: paginatedResult.total,
                page: page,
                per_page: per_page,
            };
        }

        return {
            results: paginatedResult,
            total: paginatedResult.length,
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
            .withGraphFetched('[user, room, amenities, topic]')
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('topic', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('amenities', builder => {
                builder.select('amenities.id as id', 'amenities.name');
            })
            .where('is_active', 1)
            .where('id_user', id_user)
            .page(page - 1, per_page)
            .orderBy('created_at', 'DESC');

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
            .where('is_active', 1)
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
            .where('is_active', 1)
            .whereIn('status', ['Submit', 'Approved'])
            .andWhere(builder => {
                builder.where('start_time', '<', endTime)
                    .andWhere('end_time', '>', startTime);
            })
            .withGraphFetched('user(selectUsername)')
            .modifiers({
                selectUsername: builder => builder.select('nama_user')
            })

        return query;
    }

    async markAsConflicting(bookingIds, trx) {
        if (!bookingIds || bookingIds.length === 0) return;

        return this.model.query(trx)
            .whereIn('id', bookingIds)
            .patch({ is_conflicting: 1 });
    }

    async updateProofPath(bookingId, filePath, admin_note, trx) {
        return this.model.query(trx).patchAndFetchById(bookingId, {
            proof_of_booking_path: filePath,
            admin_note: admin_note
        });
    }

    async findAllForExport(queryParams) {
        const { startDate, endDate, status } = queryParams;

        const query = Booking.query()
            .where('is_active', 1)
            .withGraphFetched('[user(selectUsername), room(selectRoomWithCabId), topic(selectTopicName), amenities(selectAmenityName)]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user', 'email'),
                selectRoomWithCabId: builder => builder.select('id', 'name', 'cab_id'),
                selectTopicName: builder => builder.select('id', 'name'),
                selectAmenityName: builder => builder.select('amenities.id', 'amenities.name')
            });

        if (startDate && endDate) {
            query.whereBetween('bookings.start_time', [startDate, endDate]);
        }

        if (status) {
            query.where('bookings.status', status);
        }
        return query
    }

    async options(userId, search) {
        const query = Booking.query()
            .select('*')
            .where('is_active', 1)
            .whereIn('status', ['Submit', 'Approved'])

        if (search) {
            query.where(builder => {
                builder.where('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        Booking.relatedQuery('room')
                            .where('name', 'like', `%${search}%`)
                    );
            });
        }

        if (userId) {
            query.where('id_user', userId);
        }


        const data = await query;

        return data;
    }
}

module.exports = new BookingRepository();