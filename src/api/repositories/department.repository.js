const BaseRepository = require('./base.repository');
const Department = require('../models/Department');

class DepartmentRepository extends BaseRepository {
    constructor() {
        super(Department);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Department.query()
            .select('*')
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('nama_dept', 'like', `%${search}%`);
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
        const query = Department.query()
            .select('id_dept', 'nama_dept',)

        if (params) {
            query.where('nama_dept', 'like', `%${params}%`);
        }

        const data = await query;

        return data;
    }

}

module.exports = new DepartmentRepository();