const express = require('express');
const cors = require("cors");
const mainRouter = require('./src/api/routes/index');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
app.use(cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', mainRouter);

app.use(errorHandler);

module.exports = app;
