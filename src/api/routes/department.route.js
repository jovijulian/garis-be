const express = require('express');
const router = express.Router();

const DepartmentController = require('../controllers/department.controller');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.get('/options', DepartmentController.options);


module.exports = router;