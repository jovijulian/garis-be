const express = require('express');
const router = express.Router();

const InventoryTransactionController = require('../controllers/inventory-transaction.controller');
const validate = require('../../middlewares/validate');
const {
    stockInSchema,
    stockOutSchema,
    returnAssetSchema,
    adjustStockSchema,
    stockOutUserSchema
} = require('../../validations/inventory-transaction.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/stock-in', validate(stockInSchema), InventoryTransactionController.stockIn);
router.post('/stock-out', validate(stockOutSchema), InventoryTransactionController.stockOut);
router.post('/stock-out/user', validate(stockOutUserSchema), InventoryTransactionController.stockOutUser);
router.post('/return', validate(returnAssetSchema), InventoryTransactionController.returnAsset);
router.post('/adjustment', validate(adjustStockSchema), InventoryTransactionController.adjustStock);
router.get('/', InventoryTransactionController.getLogTransactions);
router.get('/user', InventoryTransactionController.getLogTransactionsUser);


module.exports = router;