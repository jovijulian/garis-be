const express = require('express');
const router = express.Router();

const InventoryItemController = require('../controllers/inventory-item.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    bulkCreateSchema, 
    updateSchema,
    inventoryItemIdSchema,
} = require('../../validations/inventory-item.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), InventoryItemController.create);
router.post('/bulk', validate(bulkCreateSchema), InventoryItemController.bulkCreate);
router.get('/', InventoryItemController.getAll);
router.get('/check-barcode', InventoryItemController.checkBarcode);
router.get('/:id', validate(inventoryItemIdSchema), InventoryItemController.detail);
router.put('/:id', validate(updateSchema), InventoryItemController.update);
router.delete('/:id', validate(inventoryItemIdSchema), InventoryItemController.delete);

module.exports = router;