const reimbursementService = require('../services/reimbursement.service');
const { success, error, paginated } = require('../../utils/response');

class ReimbursementController {

    async createRequest(req, res) {
        try {
            const data = await reimbursementService.createRequest(req);
            return success(res, 201, data, 'Reimbursement request created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await reimbursementService.getAllUser(req.query, req);
            return paginated(res, 200, paginatedData, 'Reimbursement requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.getRequestById(id);
            return success(res, 200, data, 'Reimbursement request retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.updateRequest(id, req);
            return success(res, 200, data, 'Reimbursement request updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await reimbursementService.deleteRequest(id);
            return success(res, 200, null, 'Reimbursement request has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateApproval(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.updateApprovalStatus(id, req);
            return success(res, 200, null, 'Reimbursement approval status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await reimbursementService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Reimbursement requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }
}

module.exports = new ReimbursementController();