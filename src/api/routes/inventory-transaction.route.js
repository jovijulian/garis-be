const express = require('express');
const router = express.Router();

const InventoryTransactionController = require('../controllers/inventory-transaction.controller');
const validate = require('../../middlewares/validate');
const {
    stockInSchema,
    stockOutSchema
} = require('../../validations/inventory-transaction.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/stock-in', validate(stockInSchema), InventoryTransactionController.stockIn);
router.post('/stock-out', validate(stockOutSchema), InventoryTransactionController.stockOut);


module.exports = router;