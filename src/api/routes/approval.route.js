const express = require('express');
const router = express.Router();
const ApprovalController = require('../controllers/approval.controller');
const verifyToken = require('../../middlewares/verifyToken');
const validate = require('../../middlewares/validate');
const {
    approvalIdSchema,
    approvalSchema
} = require('../../validations/approval.validation');
router.use(verifyToken);

router.get('/notifications', ApprovalController.getNotifications);
router.get('/notifications/:id', validate(approvalIdSchema), ApprovalController.detail);
router.put('/notifications/:id/action', validate(approvalSchema), ApprovalController.processAction);

module.exports = router;