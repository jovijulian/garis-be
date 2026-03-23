const BaseRepository = require('./base.repository');
const InventoryLoan = require('../models/InventoryLoan');

class InventoryLoanRepository extends BaseRepository {
    constructor() {
        super(InventoryLoan);
    }
}

module.exports = new InventoryLoanRepository();