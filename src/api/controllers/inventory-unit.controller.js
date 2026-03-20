const inventoryUnitService = require('../services/inventory-unit.service');
const { success, error, paginated } = require('../../utils/response');

class InventoryUnitController {

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryUnitService.create(payload);
            return success(res, 201, data, 'Inventory Unit created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await inventoryUnitService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Inventory Units retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await inventoryUnitService.detail(id);
            return success(res, 200, data, 'Inventory Unit retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;

            const data = await inventoryUnitService.update(id, payload);
            return success(res, 200, data, 'Inventory Unit updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await inventoryUnitService.delete(id);
            return success(res, 200, null, 'Inventory Unit has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const params = req.query.search;
            const data = await inventoryUnitService.options(params);
            return success(res, 200, data, 'Inventory Unit options retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new InventoryUnitController();