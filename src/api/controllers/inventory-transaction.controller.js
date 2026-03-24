const inventoryTransactionService = require('../services/inventory-transaction.service');
const { success, error, paginated } = require('../../utils/response');

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

    async stockOut(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryTransactionService.stockOut(payload, req);

            return success(res, 201, data, 'Transaksi pengeluaran barang berhasil diproses.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async returnAsset(req, res) {
        try {
            const payload = req.body;
            const data = await inventoryTransactionService.returnAsset(payload, req);

            return success(res, 201, data, 'Transaksi pengembalian barang berhasil diproses.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getLogTransactions(req, res) {
        try {
            const paginatedData = await inventoryTransactionService.getLogTransactions(req.query, req);
            return paginated(res, 200, paginatedData, 'Inventory Transaction Logs retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }
}

module.exports = new InventoryTransactionController();