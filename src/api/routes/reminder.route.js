const express = require('express');
const router = express.Router();

const ReminderController = require('../controllers/reminder.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    reminderIdSchema
} = require('../../validations/reminder.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), ReminderController.create);
router.get('/', ReminderController.getAll);
router.get('/options', ReminderController.options);
router.get('/:id', validate(reminderIdSchema), ReminderController.detail);
router.get('/mark/:id', validate(reminderIdSchema), ReminderController.markAsCompleted);
router.put('/:id', validate(updateSchema), ReminderController.update);
router.delete('/:id', validate(reminderIdSchema), ReminderController.delete);

module.exports = router;