const express = require('express');
const router = express.Router();

const OrderController = require('../controllers/order.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    orderIdSchema
} = require('../../validations/order.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), OrderController.create);
router.get('/', OrderController.getAll);
router.get('/user', OrderController.getAllUser);
router.get('/options', OrderController.options);
router.get('/:id', validate(orderIdSchema), OrderController.detail);
router.put('/:id', validate(updateSchema), OrderController.update);
router.put('/user/:id', validate(updateSchema), OrderController.updateOrderUser);
router.put('/status/:id', validate(orderIdSchema), OrderController.updateOrderStatus);
router.delete('/:id', validate(orderIdSchema), OrderController.delete);

module.exports = router;