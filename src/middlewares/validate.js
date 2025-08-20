const { validationError } = require('../utils/response');
const { ZodError } = require('zod');
const formatZodError = (error) => {
    const formattedErrors = {};
    error.issues.forEach((issue) => {
        const fieldName = issue.path[issue.path.length - 1];
        if (!formattedErrors[fieldName]) {
            formattedErrors[fieldName] = issue.message;
        }
    });
    return formattedErrors;
};

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errors = formatZodError(err);
            return validationError(res, 422, 'Validation Error', errors);
        }

        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = validate;