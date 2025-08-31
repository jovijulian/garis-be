const BaseRepository = require('./base.repository');
const Booking = require('../models/Booking');
const { knexConnection } = require('../../config/database');

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Booking.query()
            .select(
                '*',
                knexConnection.raw(`
                    EXISTS (
                        SELECT 1
                        FROM bookings as b2
                        WHERE
                            b2.id != bookings.id AND
                            b2.room_id = bookings.room_id AND
                            b2.booking_date = bookings.booking_date AND
                            b2.status IN ('Approved', 'Submit') AND
                            (
                                bookings.start_time < ADDTIME(b2.start_time, SEC_TO_TIME(b2.duration_minutes * 60)) AND
                                ADDTIME(bookings.start_time, SEC_TO_TIME(bookings.duration_minutes * 60)) > b2.start_time
                            )
                    ) as is_conflicting
                `)
            )
            .withGraphFetched('[user(selectName), room(selectName)]')
            .modifiers({
                selectName: builder => builder.select('id', 'name')
            })
            .page(page - 1, per_page)
            .orderBy('booking_date', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        Booking.relatedQuery('user')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        Booking.relatedQuery('room')
                            .where('name', 'like', `%${search}%`)
                    );
            });
        }

        const paginatedResult = await query;

        const resultsWithBooleanConflict = paginatedResult.results.map(booking => ({
            ...booking,
            is_conflicting: !!booking.is_conflicting
        }));

        return {
            results: resultsWithBooleanConflict,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }


    async findAllWithFiltersByUserId(queryParams = {}, user_id) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Booking.query()
            .select('*')
            .withGraphFetched('[user, room]')
            .modifyGraph('user', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('room', builder => {
                builder.select('id', 'name');
            })
            .where('user_id', user_id)
            .page(page - 1, per_page)
            .orderBy('booking_date', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('user_id', 'like', `%${search}%`)
                    .orWhere('room_id', 'like', `%${search}%`)

                    .orWhereExists(
                        User.relatedQuery('user')
                            .where('name', 'like', `%${search}%`)
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

    async findApprovedConflicts(roomId, date, startTime, endTime, trx) {
        const query = Booking.query(trx)
        .where('room_id', roomId)
        .andWhere('booking_date', date)
        .andWhere('status', 'Approved')
        .andWhere(builder => {
            // --- LOGIKA PERBAIKAN ---
            // SEBELUMNYA (SALAH):
            // builder.whereRaw('? < ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60))', [startTime])
            //        .andWhereRaw('? > start_time', [endTime]);

            // SESUDAHNYA (BENAR):
            // Logika: WaktuMulai_Baru < WaktuSelesai_Lama DAN WaktuSelesai_Baru > WaktuMulai_Lama
            builder.where('start_time', '<', endTime)
                   .andWhereRaw('ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60)) > ?', [startTime]);
        });
        return query;
    }

    async findPendingConflicts(roomId, date, startTime, endTime, trx) {
        return Booking.query(trx)
            .where('room_id', roomId)
            .andWhere('booking_date', date)
            .andWhere('status', 'Submit')
            .andWhere(builder => {
                builder.whereRaw('? < ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60))', [startTime])
                    .andWhereRaw('? > start_time', [endTime]);
            });
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
}

module.exports = new BookingRepository();