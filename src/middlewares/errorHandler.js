
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;

    return error(res, statusCode, err.message);
};

module.exports = errorHandler;