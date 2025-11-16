const dashboardService = require('../services/dashboard.service');
const { success, error } = require('../../utils/response');

class DashboardController {

    async getDashboardData(req, res) {
        try {
            const data = await dashboardService.getDashboardData(req.query, req);
            return success(res, 200, data, 'Dashboard Data retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }
    async getOrderDashboardData(req, res) {
        try {
            const data = await dashboardService.getOrderDashboardData(req.query, req);
            return success(res, 200, data, 'Dashboard Data retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }
    async getVehicleRequestDashboardData(req, res) {
        try {
            const data = await dashboardService.getVehicleRequestDashboardData(req.query, req);
            return success(res, 200, data, 'Dashboard Data retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getPendingRequestsCount(req, res) {
        try {
            const data = await dashboardService.getPendingRequestsCount(req);
            return success(res, 200, data, 'Pending Requests Count retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }
}

module.exports = new DashboardController();