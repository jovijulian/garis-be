const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const validate = require('../../middlewares/validate');
const {
    createUserSchema,
    updateUserSchema,
    userIdSchema
} = require('../../validations/user.validation');
// const verifyToken = require('../../middlewares/verifyToken'); if use middleware for token

// router.use(verifyToken); if use middleware for token
router.post('/', validate(createUserSchema), userController.create);
router.get('/', userController.getAll);
router.get('/:id', validate(userIdSchema), userController.detail);
router.put('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', validate(userIdSchema), userController.delete);

module.exports = router;