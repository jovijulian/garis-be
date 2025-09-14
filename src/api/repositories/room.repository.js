const BaseRepository = require('./base.repository');
const Room = require('../models/Room');
const Site = require('../models/Site');

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
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`)
                .where('is_active', 1)
                .orWhere('location', 'like', `%${search}%`)
                .orWhere('description', 'like', `%${search}%`)

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
            .select('id', 'name', 'capacity', 'location', 'cab_id')
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id', 'nama_cab');
            })
            .where('is_active', 1)

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
        return Room.query().findById(id).withGraphFetched(relations);
    }

    async optionsSite(params) {
        const query = Site.query()
            .select('*')

        if (params) {
            query.where('nama_cab', 'like', `%${params}%`)
        }

        const data = await query;

        return data;
    }

}

module.exports = new RoomRepository();