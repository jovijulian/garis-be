const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const inventoryItemRepository = require('../repositories/inventory-item.repository');
const { formatDateTime, getUserId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class InventoryTransactionService {
    
    async stockIn(payload, request) {
        const getUser = getUserId(request);
        
        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();
            
            const item = await inventoryItemRepository.findByIdWithRelations(payload.item_id, null);
            if (!item) {
                const error = new Error('Inventory Item tidak ditemukan.');
                error.statusCode = 404;
                throw error;
            }

            const inputQty = parseInt(payload.input_qty);
            let baseQtyToAdd = 0;

            if (payload.input_unit_id === item.pack_unit_id) {
                baseQtyToAdd = inputQty * (item.qty_per_pack || 1);
            } else if (payload.input_unit_id === item.base_unit_id) {
                baseQtyToAdd = inputQty;
            } else {
                throw new Error('Satuan input tidak sesuai dengan konfigurasi barang.');
            }

            const transactionPayload = {
                cab_id: item.cab_id, 
                item_id: item.id,
                user_id: getUser,
                transaction_type: 'STOCK_IN',
                input_qty: inputQty,
                input_unit_id: payload.input_unit_id,
                qty: baseQtyToAdd,
                note: payload.note || 'Penambahan Stok Masuk',
                created_at: now,
                updated_at: now
            };

            const newTransaction = await inventoryTransactionRepository.create(transactionPayload, trx);

            const currentStock = item.stock_available || 0;
            const newStock = currentStock + baseQtyToAdd;
            
            await inventoryItemRepository.update(item.id, { stock_available: newStock }, trx);

            return newTransaction;
        });
    }
}

module.exports = new InventoryTransactionService();