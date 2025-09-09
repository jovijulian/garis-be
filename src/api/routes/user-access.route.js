const express = require('express');
const router = express.Router();

const UserAccessController = require('../controllers/user-access.controller');
const validate = require('../../middlewares/validate');
const verifyToken = require('../../middlewares/verifyToken');
// const authorize = require('../../middlewares/authorize');
const {
    updateUserAccessSchema
} = require('../../validations/user-access.validation');

router.use(verifyToken);

router.get(
    '/', 
    UserAccessController.getAll
);

router.get(
    '/sites', 
    UserAccessController.optionsSite
);

router.put(
    '/:userId',
    validate(updateUserAccessSchema),
    UserAccessController.update
);

module.exports = router;