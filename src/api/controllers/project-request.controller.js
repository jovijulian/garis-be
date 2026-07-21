const projectRequestService = require('../services/project-request.service');
const { success, error, paginated } = require('../../utils/response');

class ProjectRequestController {

    async createRequest(req, res) {
        try {
            const data = await projectRequestService.createRequest(req);
            return success(res, 201, data, 'Project request created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await projectRequestService.getAllUser(req.query, req);
            return paginated(res, 200, paginatedData, 'Project requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.getRequestById(id);
            return success(res, 200, data, 'Project request retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.updateRequest(id, req);
            return success(res, 200, data, 'Project request updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await projectRequestService.deleteRequest(id);
            return success(res, 200, null, 'Project request has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateApproval(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.updateApprovalStatus(id, req);
            return success(res, 200, null, 'Project request approval status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await projectRequestService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Project Requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async addProgress(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.addProgress(id, req);
            return success(res, 201, data, 'Progress added successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async requestVerification(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.requestVerification(id, req);
            return success(res, 200, data, 'Successfully requested verification from user');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }


    async verification(req, res) {
        try {
            const id = req.params.id;
            const data = await projectRequestService.verifyRequest(id, req);
            return success(res, 201, data, 'Progress added successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ProjectRequestController();