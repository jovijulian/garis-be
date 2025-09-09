const userAccessService = require('../services/user-access.service');
const { success, error, paginated } = require('../../utils/response');

class UserAccessController {

    async getAll(req, res) {
        try {
            const paginatedData = await userAccessService.getAll(req.query);
            return success(res, 200, paginatedData, 'User retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.userId;
            const payload = req.body;

            const data = await userAccessService.updateUserAccess(id, payload);
            return success(res, 200, data, 'User updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsSite(req, res) {
        try {
            const params = req.query.search;
            const data = await userAccessService.getAllSites(params);
            return success(res, 200, data, 'Site options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new UserAccessController();