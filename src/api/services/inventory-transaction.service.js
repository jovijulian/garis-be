const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryLoanRepository = require('../repositories/inventory-loan.repository');
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

    async stockOut(payload, request) {
        const userId = getUserId(request);
        
        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();
            const results = [];

            for (let i = 0; i < payload.items.length; i++) {
                const reqItem = payload.items[i];
                const item = await inventoryItemRepository.findByIdWithRelations(reqItem.item_id, null);
                if (!item) {
                    const error = new Error(`Barang dengan ID ${reqItem.item_id} tidak ditemukan.`);
                    error.statusCode = 404;
                    throw error;
                }

                const inputQty = parseInt(reqItem.input_qty);
                let baseQtyToDeduct = 0;
                if (reqItem.input_unit_id === item.pack_unit_id) {
                    baseQtyToDeduct = inputQty * (item.qty_per_pack || 1);
                } else if (reqItem.input_unit_id === item.base_unit_id) {
                    baseQtyToDeduct = inputQty;
                } else {
                    const error = new Error(`Satuan input tidak sesuai dengan konfigurasi barang: ${item.name}`);
                    error.statusCode = 400;
                    throw error;
                }

                const currentStock = item.stock_available || 0;
                if (currentStock < baseQtyToDeduct) {
                    const error = new Error(`Gagal: Stok '${item.name}' tidak mencukupi. (Diminta: ${baseQtyToDeduct}, Sisa: ${currentStock})`);
                    error.statusCode = 400;
                    throw error;
                }

                const isAsset = item.item_type === 2;
                const trxType = isAsset ? 'OUT_ASSET' : 'OUT_BHP';

                const transactionPayload = {
                    cab_id: item.cab_id, 
                    item_id: item.id,
                    user_id: payload.user_id_borrower || userId,
                    transaction_type: trxType,
                    input_qty: inputQty,
                    input_unit_id: reqItem.input_unit_id,
                    qty: baseQtyToDeduct,
                    note: payload.note || 'Pengeluaran Barang (Stock Out)',
                    created_at: now,
                    updated_at: now
                };

                const newTransaction = await inventoryTransactionRepository.create(transactionPayload, trx);

                if (isAsset) {
                    const loanPayload = {
                        cab_id: item.cab_id,
                        transaction_id: newTransaction.id,
                        item_id: item.id,
                        user_id: payload.user_id_borrower || userId, 
                        qty_borrowed: baseQtyToDeduct,
                        qty_returned: 0, 
                        status: 'BORROWED',
                        borrowed_at: now,
                    };
                    await inventoryLoanRepository.create(loanPayload, trx);
                }

                const newStock = currentStock - baseQtyToDeduct;
                await inventoryItemRepository.update(item.id, { stock_available: newStock, updated_at: now }, trx);

                results.push({ item_name: item.name, deducted_qty: baseQtyToDeduct, is_loan: isAsset });
            }

            return results;
        });
    }
}

module.exports = new InventoryTransactionService();