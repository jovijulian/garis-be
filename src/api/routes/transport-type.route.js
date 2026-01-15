const express = require('express');
const router = express.Router();

const TransportTypeController = require('../controllers/transport-type.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    transportTypeIdSchema
} = require('../../validations/transport-type.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), TransportTypeController.create);
router.get('/', TransportTypeController.getAll);
router.get('/options', TransportTypeController.options);
router.get('/:id', validate(transportTypeIdSchema), TransportTypeController.detail);
router.put('/:id', validate(updateSchema), TransportTypeController.update);
router.delete('/:id', validate(transportTypeIdSchema), TransportTypeController.delete);

module.exports = router;