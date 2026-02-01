const express = require('express');
const router = express.Router();

const OpenApiController = require('../../controllers/open-api/open-api.controller');
const validate = require('../../../middlewares/validate');
const {
    createVisitorSubmissionSchema,
} = require('../../../validations/open-api/open-api.validation');
const verifyToken = require('../../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/visitor-submission', validate(createVisitorSubmissionSchema), OpenApiController.createVisitorSubmission);
router.get('/options/rooms', OpenApiController.optionsRoom);
router.get('/options/sites', OpenApiController.optionsSite);
router.get('/options/topics', OpenApiController.optionsTopic);
router.get('/options/consumption-types', OpenApiController.optionsConsumptionType);


module.exports = router;