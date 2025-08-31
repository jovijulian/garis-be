const BaseRepository = require('./base.repository');
const Room = require('../models/Room');

class RoomRepository extends BaseRepository {
    constructor() {
        super(Room);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Room.query()
            .select('*')
            .whereNull('deleted_at')
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`);
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
        const query = Room.query()
            .select('id', 'name')
            .whereNull('deleted_at')

        if (params) {
            query.where('name', 'like', `%${params}%`);
        }

        const data = await query;

        return data;
    }

}

module.exports = new RoomRepository();