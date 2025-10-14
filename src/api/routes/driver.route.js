const express = require('express');
const router = express.Router();

const DriverController = require('../controllers/driver.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    driverIdSchema
} = require('../../validations/driver.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), DriverController.create);
router.get('/', DriverController.getAll);
router.get('/options', DriverController.options);
router.get('/:id', validate(driverIdSchema), DriverController.detail);
router.put('/:id', validate(updateSchema), DriverController.update);
router.delete('/:id', validate(driverIdSchema), DriverController.delete);

module.exports = router;