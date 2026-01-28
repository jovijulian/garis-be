const departmentService = require('../services/department.service');
const { success, error, paginated } = require('../../utils/response');

class DepartmentController {

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await departmentService.options(params);
            return success(res, 200, data, 'Department options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new DepartmentController();