const express = require('express');
const router = express.Router();

const TransportOrderController = require('../controllers/transport-order.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    transportOrderIdSchema,
    updateStatusSchema,
} = require('../../validations/transport-order.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), TransportOrderController.create);
router.get('/', TransportOrderController.getAll);
router.get('/:id/receipt', TransportOrderController.generateReceipt);
router.get('/export-excel', TransportOrderController.exportToExcel);
router.get('/user', TransportOrderController.getAllUser);
router.get('/options', TransportOrderController.options);
router.get('/:id', validate(transportOrderIdSchema), TransportOrderController.detail);
router.put('/:id', validate(updateSchema), TransportOrderController.update);
router.put('/status/:id', validate(updateStatusSchema), TransportOrderController.updateOrderStatus);
router.put('/cancel/:id', validate(transportOrderIdSchema), TransportOrderController.cancelOrder);
router.delete('/:id', validate(transportOrderIdSchema), TransportOrderController.delete);

module.exports = router;