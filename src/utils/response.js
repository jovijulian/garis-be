
const success = (res, code, data, message) => {
    res.status(code).json({
        success: true,
        message: message || 'Operation successful',
        data: data,
    });
};

const error = (res, code, err, data) => {
    res.status(code).json({
        success: false,
        message: err.message || err,
        data: data || null,
    });
};

const validationError = (res, code, message, errors) => {
    res.status(code).json({
        success: false,
        message: message,
        errors: errors,
    });
};

const paginated = (res, code, paginatedData, message) => {
    const { results, total, page, per_page } = paginatedData;

    const responseData = {
        data: results,
        pagination: {
            total: total,
            page: page,
            per_page: per_page,
            total_pages: Math.ceil(total / per_page),
        },
    };

    success(res, code, responseData, message || 'Data retrieved successfully');
};

module.exports = {
    success,
    error,
    validationError,
    paginated,
};