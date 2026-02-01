const express = require('express');
const router = express.Router();

const openApiRoutes = require('./open-api.route');

router.use('/', openApiRoutes);


module.exports = router;