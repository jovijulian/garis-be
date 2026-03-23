const express = require('express');
const router = express.Router();

const InventoryTransactionController = require('../controllers/inventory-transaction.controller');
const validate = require('../../middlewares/validate');
const {
    stockInSchema,
} = require('../../validations/inventory-transaction.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/stock-in', validate(stockInSchema), InventoryTransactionController.stockIn);


module.exports = router;