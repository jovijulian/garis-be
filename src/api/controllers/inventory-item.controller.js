const inventoryItemService = require('../services/inventory-item.service');
const { success, error, paginated } = require('../../utils/response');

class InventoryItemController {

    async checkBarcode(req, res) {
        try {
            const { barcode } = req.params;
            const { cab_id } = req.query;

            if (!cab_id) {
                return error(res, 400, 'cab_id (Cabang) wajib disertakan dalam query.');
            }

            const data = await inventoryItemService.checkBarcode(barcode, cab_id);
            return success(res, 200, data, data.message);
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async create(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryItemService.create(payload, req);
            return success(res, 201, data, 'Inventory Item created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await inventoryItemService.getAll(req.query);
            return paginated(res, 200, paginatedData, 'Inventory Items retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await inventoryItemService.detail(id);
            return success(res, 200, data, 'Inventory Item retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const payload = req.body;
            const data = await inventoryItemService.update(id, payload, req);
            return success(res, 200, data, 'Inventory Item updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await inventoryItemService.delete(id);
            return success(res, 200, null, 'Inventory Item has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async bulkCreate(req, res) {
        try {
            const payloads = req.body;

            if (!Array.isArray(payloads) || payloads.length === 0) {
                return error(res, 400, 'Data harus berupa array dan tidak boleh kosong.');
            }

            const data = await inventoryItemService.bulkCreate(payloads, req);
            return success(res, 201, data, `${data.length} Inventory Items created successfully`);
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async options(req, res) {
        try {
            const data = await inventoryItemService.options(req.query, req);
            return success(res, 200, data, 'Berhasil mengambil daftar opsi barang');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new InventoryItemController();