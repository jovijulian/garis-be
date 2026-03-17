const BaseRepository = require('./base.repository');
const ReminderLog = require('../models/ReminderLog');

class ReminderLogRepository extends BaseRepository {
    constructor() {
        super(ReminderLog);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = ReminderLog.query()
            .select('*')
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`)

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
        return ReminderLog.query().findById(id).withGraphFetched(relations);
    }

    async checkExistingLog(reminderId, logDate, trx = null) {
        return ReminderLog.query(trx)
            .where('reminder_id', reminderId)
            .where('days_before', logDate)
            .first();
    }
}

module.exports = new ReminderLogRepository();