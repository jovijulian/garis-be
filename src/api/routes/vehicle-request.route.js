const express = require('express');
const router = express.Router();

const VehicleRequestController = require('../controllers/vehicle-request.controller');
const validate = require('../../middlewares/validate');
const {
    createRequestSchema,
    updateRequestSchema,
    updateStatusSchema,
    requestIdSchema,
} = require('../../validations/vehicle-request.validation');
const {
    assignSchema
} = require('../../validations/vehicle-assignment.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createRequestSchema), VehicleRequestController.create);
router.get('/', VehicleRequestController.getAll);
router.get('/user', VehicleRequestController.getAllUser);
router.get('/driver', VehicleRequestController.myAssign);
router.get('/:id', validate(requestIdSchema), VehicleRequestController.detail);
router.get('/spj/:id', validate(requestIdSchema), VehicleRequestController.downloadSPJ);
router.put('/:id', validate(updateRequestSchema), VehicleRequestController.update);
router.put('/status/:id', validate(updateStatusSchema), VehicleRequestController.updateVehicleRequestStatus);
router.put('/assignment/:requestId', validate(assignSchema), VehicleRequestController.assign);
router.put('/cancel/:id', validate(requestIdSchema), VehicleRequestController.cancelRequest);
router.delete('/:id', validate(requestIdSchema), VehicleRequestController.delete);

module.exports = router;