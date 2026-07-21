const approvalService = require('../services/approval.service');
const { success, error } = require('../../utils/response');

class ApprovalController {

    async getNotifications(req, res) {
        try {
            const data = await approvalService.getMyNotifications(req);
            return success(res, 200, data, 'Approval notifications retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await approvalService.getNotificationDetail(id, req);
            return success(res, 200, data, 'Approval detail retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async processAction(req, res) {
        try {
            const data = await approvalService.processAction(req);
            return success(res, 200, null, 'Approval action processed successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new ApprovalController();