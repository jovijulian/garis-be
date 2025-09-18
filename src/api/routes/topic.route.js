const express = require('express');
const router = express.Router();

const TopicController = require('../controllers/topic.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    topicIdSchema
} = require('../../validations/topic.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), TopicController.create);
router.get('/', TopicController.getAll);
router.get('/options', TopicController.options);
router.get('/:id', validate(topicIdSchema), TopicController.detail);
router.put('/:id', validate(updateSchema), TopicController.update);
router.delete('/:id', validate(topicIdSchema), TopicController.delete);

module.exports = router;