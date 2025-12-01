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
            .withGraphFetched('[cabang, amenities]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('amenities', builder => {
                builder.select('id', 'name');
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

    async options(params, site) {
        const query = Room.query()
            .select('id', 'name', 'capacity', 'location', 'cab_id')
            .withGraphFetched('[cabang, amenities]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('amenities', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)

        if (site) {
            query.where('cab_id', site)
        }

        if (params) {
            query.where('name', 'like', `%${params}%`)
                .orWhere('location', 'like', `%${params}%`)
         
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
            .whereNotNull('no_cab')

        if (params) {
            query.where('nama_cab', 'like', `%${params}%`)
        }

        const data = await query;

        return data;
    }

    async findByIdsSite(siteIds) {
        if (!siteIds || siteIds.length === 0) return [];
        return Site.query().whereIn('id_cab', siteIds);
    }

    async syncAmenities(roomId, amenityIds, trx) {
        const db = trx || Room.knex();
        const PIVOT_TABLE = 'room_amenities';
        await db(PIVOT_TABLE)
            .where('room_id', roomId)
            .delete();
        if (amenityIds && amenityIds.length > 0) {
            const dataToInsert = amenityIds.map(amenityId => ({
                room_id: roomId,
                amenity_id: amenityId
            }));

            await db(PIVOT_TABLE).insert(dataToInsert);
        }
    }

}

module.exports = new RoomRepository();