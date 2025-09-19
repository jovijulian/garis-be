const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/dashboard.controller');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.get('/', DashboardController.getDashboardData);

module.exports = router;