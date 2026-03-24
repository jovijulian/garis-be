const express = require('express');
const router = express.Router();

const InventoryTransactionController = require('../controllers/inventory-transaction.controller');
const validate = require('../../middlewares/validate');
const {
    stockInSchema,
    stockOutSchema,
    returnAssetSchema,
} = require('../../validations/inventory-transaction.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/stock-in', validate(stockInSchema), InventoryTransactionController.stockIn);
router.post('/stock-out', validate(stockOutSchema), InventoryTransactionController.stockOut);
router.post('/return', validate(returnAssetSchema), InventoryTransactionController.returnAsset);


module.exports = router;