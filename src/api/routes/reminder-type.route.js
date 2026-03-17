const express = require('express');
const router = express.Router();

const ReminderTypeController = require('../controllers/reminder-type.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    reminderTypeIdSchema
} = require('../../validations/reminder-type.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), ReminderTypeController.create);
router.get('/', ReminderTypeController.getAll);
router.get('/options', ReminderTypeController.options);
router.get('/:id', validate(reminderTypeIdSchema), ReminderTypeController.detail);
router.put('/:id', validate(updateSchema), ReminderTypeController.update);
router.delete('/:id', validate(reminderTypeIdSchema), ReminderTypeController.delete);

module.exports = router;