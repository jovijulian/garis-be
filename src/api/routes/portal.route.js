const express = require('express');
const router = express.Router();

const PortalController = require('../controllers/portal.controller');
const validate = require('../../middlewares/validate');
const {
    loginSchema,
} = require('../../validations/auth.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.post('/login', validate(loginSchema), PortalController.login);
router.post('/logout', verifyToken, PortalController.logout);

module.exports = router;