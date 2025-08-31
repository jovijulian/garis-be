const express = require('express');
const router = express.Router();

const RoomController = require('../controllers/room.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    roomIdSchema
} = require('../../validations/room.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), RoomController.create);
router.get('/', RoomController.getAll);
router.get('/options', RoomController.options);
router.get('/:id', validate(roomIdSchema), RoomController.detail);
router.put('/:id', validate(updateSchema), RoomController.update);
router.delete('/:id', validate(roomIdSchema), RoomController.delete);

module.exports = router;