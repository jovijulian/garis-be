const express = require('express');
const router = express.Router();

const InventoryCategoryController = require('../controllers/inventory-category.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    inventoryCategoryIdSchema
} = require('../../validations/inventory-category.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), InventoryCategoryController.create);
router.get('/', InventoryCategoryController.getAll);
router.get('/options', InventoryCategoryController.options);
router.get('/:id', validate(inventoryCategoryIdSchema), InventoryCategoryController.detail);
router.put('/:id', validate(updateSchema), InventoryCategoryController.update);
router.delete('/:id', validate(inventoryCategoryIdSchema), InventoryCategoryController.delete);

module.exports = router;