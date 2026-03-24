const express = require('express');
const router = express.Router();

const InventoryLoanController = require('../controllers/inventory-loan.controller');
const validate = require('../../middlewares/validate');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);


router.get('/', InventoryLoanController.getAll);

module.exports = router;