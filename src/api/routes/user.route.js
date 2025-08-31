const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const validate = require('../../middlewares/validate');
const {
    createUserSchema,
    updateUserSchema,
    userIdSchema
} = require('../../validations/user.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);
router.post('/', verifyToken, validate(createUserSchema), userController.create);
router.get('/', verifyToken, userController.getAll);
router.get('/:id', verifyToken, validate(userIdSchema), userController.detail);
router.put('/:id', verifyToken, validate(updateUserSchema), userController.update);
router.delete('/:id', verifyToken, validate(userIdSchema), userController.delete);

module.exports = router;