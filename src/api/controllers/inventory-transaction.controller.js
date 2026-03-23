const inventoryTransactionService = require('../services/inventory-transaction.service');
const { success, error } = require('../../utils/response');

class InventoryTransactionController {

    async stockIn(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryTransactionService.stockIn(payload, req);
            return success(res, 201, data, 'Stock In berhasil dicatat');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new InventoryTransactionController();