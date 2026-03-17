const BaseRepository = require('./base.repository');
const Reminder = require('../models/Reminder');
const Site = require('../models/Site');

class ReminderRepository extends BaseRepository {
    constructor() {
        super(Reminder);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Reminder.query()
            .select('*')
            .withGraphFetched('[cabang, reminder_type]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('reminder_type', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('title', 'like', `%${search}%`)
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
        const query = Reminder.query()
            .select('id', 'title')
            .withGraphFetched('[cabang, reminder_type]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('reminder_type', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)

        if (params) {
            query.where('title', 'like', `%${params}%`)
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return Reminder.query().findById(id).withGraphFetched(relations);
    }

}

module.exports = new ReminderRepository();