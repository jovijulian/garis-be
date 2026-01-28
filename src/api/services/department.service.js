const departmentRepository = require('../repositories/department.repository');
class DepartmentService {

    async options(params) {
        const data = await departmentRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }
}

module.exports = new DepartmentService();