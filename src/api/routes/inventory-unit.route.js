const express = require('express');
const router = express.Router();

const InventoryUnitController = require('../controllers/inventory-unit.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    inventoryUnitIdSchema
} = require('../../validations/inventory-unit.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), InventoryUnitController.create);
router.get('/', InventoryUnitController.getAll);
router.get('/options', InventoryUnitController.options);
router.get('/:id', validate(inventoryUnitIdSchema), InventoryUnitController.detail);
router.put('/:id', validate(updateSchema), InventoryUnitController.update);
router.delete('/:id', validate(inventoryUnitIdSchema), InventoryUnitController.delete);

module.exports = router;