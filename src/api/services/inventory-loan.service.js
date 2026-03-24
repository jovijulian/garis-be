const inventoryLoanRepository = require('../repositories/inventory-loan.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class InventoryLoanService {

    async getAll(queryParams, request) {
        const cabId = getCabId(request)
        return inventoryLoanRepository.findAllWithFilters(queryParams, cabId);
    }
}

module.exports = new InventoryLoanService();