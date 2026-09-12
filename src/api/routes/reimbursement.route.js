const express = require('express');
const router = express.Router();

const ReimbursementController = require('../controllers/reimbursement.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    requestIdSchema,
    approvalSchema
} = require('../../validations/reimbursement.validation');
const verifyToken = require('../../middlewares/verifyToken');
const upload = require('../../middlewares/upload'); 

router.use(verifyToken);

router.post('/',
    upload.array('files', 10),
    validate(createSchema),
    ReimbursementController.createRequest
);

router.get('/', ReimbursementController.getAll);
router.get('/user', ReimbursementController.getAllUser);
router.get('/:id', validate(requestIdSchema), ReimbursementController.detail);

router.post('/:id', 
    upload.array('files', 10), 
    validate(updateSchema), 
    ReimbursementController.update
);

router.put('/:id/approval', validate(approvalSchema), ReimbursementController.updateApproval);

router.delete('/:id', validate(requestIdSchema), ReimbursementController.delete);

module.exports = router;