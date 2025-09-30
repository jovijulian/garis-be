const express = require('express');
const router = express.Router();

const ConsumptionTypeController = require('../controllers/consumption-type.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    consumptionTypeIdSchema
} = require('../../validations/consumption-type.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), ConsumptionTypeController.create);
router.get('/', ConsumptionTypeController.getAll);
router.get('/options', ConsumptionTypeController.options);
router.get('/:id', validate(consumptionTypeIdSchema), ConsumptionTypeController.detail);
router.put('/:id', validate(updateSchema), ConsumptionTypeController.update);
router.delete('/:id', validate(consumptionTypeIdSchema), ConsumptionTypeController.delete);

module.exports = router;