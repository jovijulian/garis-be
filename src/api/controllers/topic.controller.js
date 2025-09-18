const topicService = require('../services/topic.service');
const { success, error, paginated } = require('../../utils/response');

class TopicController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await topicService.create(payload);
            return success(res, 201, data, 'Topic created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await topicService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Topics retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await topicService.detail(id);
            return success(res, 200, data, 'Topic retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await topicService.update(id, payload);
            return success(res, 200, data, 'Topic updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await topicService.delete(id);
            return success(res, 200, null, 'Topic has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await topicService.options(params);
            return success(res, 200, data, 'Topic options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new TopicController();