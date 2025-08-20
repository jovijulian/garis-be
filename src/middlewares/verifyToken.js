const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, 401, new Error('Unauthorized: No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedPayload;
        next();
    } catch (err) {
        return error(res, 401, new Error('Unauthorized: Invalid or expired token'));
    }
};

module.exports = authMiddleware;