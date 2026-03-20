const inventoryCategoryService = require('../services/inventory-category.service');
const { success, error, paginated } = require('../../utils/response');

class InventoryCategoryController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryCategoryService.create(payload);
            return success(res, 201, data, 'Inventory Category created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await inventoryCategoryService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Inventory Categories retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await inventoryCategoryService.detail(id);
            return success(res, 200, data, 'Inventory Category retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await inventoryCategoryService.update(id, payload);
            return success(res, 200, data, 'Inventory Category updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await inventoryCategoryService.delete(id);
            return success(res, 200, null, 'Inventory Category has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await inventoryCategoryService.options(params);
            return success(res, 200, data, 'Inventory Category options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new InventoryCategoryController();