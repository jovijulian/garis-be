const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const validate = require('../../middlewares/validate');
const {
    loginSchema,
    changePasswordSchema
} = require('../../validations/auth.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.me);
router.post('/change-password', verifyToken, validate(changePasswordSchema), AuthController.changePassword);

module.exports = router;