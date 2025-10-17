const express = require('express');
const router = express.Router();

const VehicleController = require('../controllers/vehicle.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    vehicleIdSchema,
    updateStatusSchema
} = require('../../validations/vehicle.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), VehicleController.create);
router.get('/', VehicleController.getAll);
router.get('/options', VehicleController.options);
router.get('/:id', validate(vehicleIdSchema), VehicleController.detail);
router.put('/:id', validate(updateSchema), VehicleController.update);
router.put('/:id/status', validate(updateStatusSchema), VehicleController.updateStatus);
router.delete('/:id', validate(vehicleIdSchema), VehicleController.delete);

module.exports = router;