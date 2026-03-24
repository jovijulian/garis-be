const BaseRepository = require('./base.repository');
const Reminder = require('../models/Reminder');
const Site = require('../models/Site');

class ReminderRepository extends BaseRepository {
    constructor() {
        super(Reminder);
    }

    async findAllWithFilters(cabId, queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Reminder.query()
            .select('*')
            .withGraphFetched('[cabang, reminder_type, created_by_user, updated_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('reminder_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('updated_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .where('is_active', 1)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('title', 'like', `%${search}%`)
                .where('is_active', 1)
        }

        if (cabId) {
            query.where('cab_id', cabId);
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
            .withGraphFetched('[cabang, reminder_type, created_by_user, updated_by_user]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('reminder_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('created_by_user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('updated_by_user', builder => {
                builder.select('id_user', 'nama_user');
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

    async checkExistingReminder(date) {
        return Reminder.query()
            .withGraphFetched('[cabang, reminder_type]')
            .where('status', 'PENDING')
            .where('is_active', 1)
            .where('due_date', '>=', date);
    }

    async updateOverdueReminders(date, time) {
        return Reminder.query()
            .patch({ status: 'OVERDUE', updated_at: time })
            .where('status', 'PENDING')
            .where('is_active', 1)
            .where('due_date', '<', date);
    }



}

module.exports = new ReminderRepository();