const inventoryLoanRepository = require('../repositories/inventory-loan.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class InventoryLoanService {

    async getAll(queryParams, request) {
        const cabId = getCabId(request)
        return inventoryLoanRepository.findAllWithFilters(queryParams, cabId);
    }

    async getAllByNIK(queryParams) {
        const nik = queryParams.nik
        return inventoryLoanRepository.getAllByNIK(nik);
    }

    async getMyLoans(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return inventoryLoanRepository.findAllWithFiltersByUserId(queryParams, userId);
    }
   
}

module.exports = new InventoryLoanService();