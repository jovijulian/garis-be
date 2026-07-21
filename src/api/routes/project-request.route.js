const express = require('express');
const router = express.Router();

const ProjectRequestController = require('../controllers/project-request.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    requestIdSchema,
    approvalSchema,
    progressSchema,
    verificationSchema
} = require('../../validations/project-request.validation');
const verifyToken = require('../../middlewares/verifyToken');
const upload = require('../../middlewares/upload');
router.use(verifyToken);

router.post('/',
    upload.array('photos', 5),
    validate(createSchema),
    ProjectRequestController.createRequest
);
router.get('/', ProjectRequestController.getAll);
router.get('/user', ProjectRequestController.getAllUser);
router.get('/:id', validate(requestIdSchema), ProjectRequestController.detail);
router.post('/:id', upload.array('photos', 5), validate(updateSchema), ProjectRequestController.update);
router.post('/:id/progress',
    upload.array('photos', 5),
    validate(progressSchema),
    ProjectRequestController.addProgress
);
router.post('/:id/verification',
    upload.array('photos', 5),
    validate(verificationSchema),
    ProjectRequestController.verification
);

router.put('/:id/request-verification',
    validate(requestIdSchema),
    ProjectRequestController.requestVerification
);
router.put('/:id/approval', validate(approvalSchema), ProjectRequestController.updateApproval);
router.delete('/:id', validate(requestIdSchema), ProjectRequestController.delete);

module.exports = router;