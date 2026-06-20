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
const upload = require('../../middlewares/upload');

router.use(verifyToken);

router.post('/', validate(createSchema), ReminderController.create);
router.post('/mark/:id', validate(reminderIdSchema), upload.single('attachment'), ReminderController.markAsCompleted);
router.get('/', ReminderController.getAll);
router.get('/history/:id', ReminderController.getHistory);
router.get('/options', ReminderController.options);
router.get('/:id', validate(reminderIdSchema), ReminderController.detail);
router.put('/:id', validate(updateSchema), ReminderController.update);
router.delete('/:id', validate(reminderIdSchema), ReminderController.delete);

module.exports = router;