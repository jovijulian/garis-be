const express = require('express');
const router = express.Router();

const ReimbursementItemController = require('../controllers/reimbursement-item.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    itemIdSchema
} = require('../../validations/reimbursement-item.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), ReimbursementItemController.create);
router.get('/', ReimbursementItemController.getAll);
router.get('/options', ReimbursementItemController.options);
router.get('/:id', validate(itemIdSchema), ReimbursementItemController.detail);
router.put('/:id', validate(updateSchema), ReimbursementItemController.update);
router.delete('/:id', validate(itemIdSchema), ReimbursementItemController.delete);

module.exports = router;