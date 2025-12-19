const express = require('express');
const router = express.Router();

const AccommodationController = require('../controllers/accommodation.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    accommodationOrderIdSchema,
    updateStatusSchema,
} = require('../../validations/accommodation.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), AccommodationController.create);
router.get('/', AccommodationController.getAll);
router.get('/:id/receipt', AccommodationController.generateReceipt);
router.get('/export-excel', AccommodationController.exportToExcel);
router.get('/user', AccommodationController.getAllUser);
router.get('/options', AccommodationController.options);
router.get('/:id', validate(accommodationOrderIdSchema), AccommodationController.detail);
router.put('/:id', validate(updateSchema), AccommodationController.update);
router.put('/status/:id', validate(updateStatusSchema), AccommodationController.updateOrderStatus);
router.put('/cancel/:id', validate(accommodationOrderIdSchema), AccommodationController.cancelOrder);
router.delete('/:id', validate(accommodationOrderIdSchema), AccommodationController.delete);

module.exports = router;