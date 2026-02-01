const openApiService = require('../../services/open-api/open-api.service');
const { success, error, paginated } = require('../../../utils/response');

class OpenApiController {

    async createVisitorSubmission(req, res) {
        try {
            const data = await openApiService.createVisitorSubmission(req);
            return success(res, 201, data, 'Visitor booking created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsRoom(req, res) {
        try {
            const params = req.query.search;
            const site = req.query.site || null;
            const data = await openApiService.optionsRoom(params, site);
            return success(res, 200, data, 'Room options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsSite(req, res) {
        try {
            const params = req.query.search;
            const data = await openApiService.optionsSite(params);
            return success(res, 200, data, 'Site options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsTopic(req, res) {
        try {
            const params = req.query.search;
            const data = await openApiService.optionsTopic(params);
            return success(res, 200, data, 'Topic options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async optionsConsumptionType(req, res) {
        try {
            const params = req.query.search;
            const data = await openApiService.optionsConsumptionType(params);
            return success(res, 200, data, 'Consumption Type options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new OpenApiController();