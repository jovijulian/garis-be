const express = require('express');
const cors = require("cors");
const mainRouter = require('./src/api/routes/index');
const errorHandler = require('./src/middlewares/errorHandler');
const requestLogger = require('./src/middlewares/requestLogger');
const path = require('path');
const app = express();
const initScheduler = require('./src/cron/request-scheduler');
app.use(cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use(requestLogger);
app.use('/api/v1', mainRouter);
initScheduler();
app.use(errorHandler);

module.exports = app;
