const express = require('express');
const router = express.Router();

const VehicleTypeController = require('../controllers/vehicle-type.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    vehicleTypeIdSchema
} = require('../../validations/vehicle-type.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), VehicleTypeController.create);
router.get('/', VehicleTypeController.getAll);
router.get('/options', VehicleTypeController.options);
router.get('/:id', validate(vehicleTypeIdSchema), VehicleTypeController.detail);
router.put('/:id', validate(updateSchema), VehicleTypeController.update);
router.delete('/:id', validate(vehicleTypeIdSchema), VehicleTypeController.delete);

module.exports = router;