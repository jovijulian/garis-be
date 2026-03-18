const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/dashboard.controller');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.get('/pending', DashboardController.getPendingRequestsCount);
router.get('/', DashboardController.getDashboardData);
router.get('/orders', DashboardController.getOrderDashboardData);
router.get('/vehicle-requests', DashboardController.getVehicleRequestDashboardData);
router.get('/alert-reminder', DashboardController.getDashboardAlerts);


module.exports = router;