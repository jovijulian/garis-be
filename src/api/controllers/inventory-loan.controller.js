const inventoryLoanService = require('../services/inventory-loan.service');
const { success, error, paginated } = require('../../utils/response');

class InventoryLoanController {

    async getAll(req, res) {
        try {
            const paginatedData = await inventoryLoanService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Inventory Loans retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }


}

module.exports = new InventoryLoanController();