const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryLoanRepository = require('../repositories/inventory-loan.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class InventoryTransactionService {

    async stockIn(payload, request) {
        const getUser = getUserId(request);
        const cabId = getCabId(request);

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
                cab_id: cabId,
                item_id: item.id,
                created_by: getUser,
                nik: null,
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
        const cabId = getCabId(request);

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
                    cab_id: cabId,
                    item_id: item.id,
                    created_by: userId,
                    nik: payload.nik,
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
                        cab_id: cabId,
                        transaction_id: newTransaction.id,
                        item_id: item.id,
                        created_by: userId,
                        nik: payload.nik,
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

    async returnAsset(payload, request) {
        const userId = getUserId(request);
        const cabId = getCabId(request);

        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();

            const loan = await inventoryLoanRepository.findById(payload.loan_id, trx);
            if (!loan) {
                const error = new Error("Data peminjaman tidak ditemukan.");
                error.statusCode = 404;
                throw error;
            }

            const remainingToReturn = loan.qty_borrowed - loan.qty_returned;
            if (payload.return_qty > remainingToReturn) {
                const error = new Error(`Gagal: Jumlah kembali (${payload.return_qty}) melebihi sisa pinjaman (${remainingToReturn}).`);
                error.statusCode = 400;
                throw error;
            }

            const newReturnedQty = loan.qty_returned + payload.return_qty;
            const newStatus = newReturnedQty >= loan.qty_borrowed ? 'RETURNED' : 'PARTIAL_RETURNED';

            await inventoryLoanRepository.update(loan.id, {
                qty_returned: newReturnedQty,
                status: newStatus,
                returned_at: now
            }, trx);

            const item = await inventoryItemRepository.findById(loan.item_id, trx);
            const newStock = item.stock_available + payload.return_qty;
            await inventoryItemRepository.update(item.id, {
                stock_available: newStock,
                updated_at: now
            }, trx);

            const transactionPayload = {
                cab_id: cabId,
                item_id: item.id,
                nik: loan.nik,
                created_by: userId,
                transaction_type: 'RETURN',
                input_qty: payload.return_qty,
                input_unit_id: item.base_unit_id,
                qty: payload.return_qty,
                note: payload.note || 'Pengembalian Aset Inventaris',
                created_at: now,
                updated_at: now
            };
            await inventoryTransactionRepository.create(transactionPayload, trx);

            return { item_name: item.name, returned_qty: payload.return_qty, status: newStatus };
        });
    }

    async getLogTransactions(query, request) {
        const cabId = getCabId(request);

        const logs = await inventoryTransactionRepository.findAllWithFilters(query, cabId);
        return logs;
    }

    async adjustStock(payload, request) {
        const userId = getUserId(request);
        const cabId = getCabId(request);
        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();

            const item = await inventoryItemRepository.findById(payload.item_id, trx);
            if (!item) {
                const error = new Error("Data barang tidak ditemukan.");
                error.statusCode = 404;
                throw error;
            }

            const difference = payload.actual_qty - item.stock_available;
            if (difference === 0) {
                const error = new Error("Penyesuaian ditolak. Stok fisik sudah sama dengan stok sistem saat ini.");
                error.statusCode = 400;
                throw error;
            }

            await inventoryItemRepository.update(item.id, {
                stock_available: payload.actual_qty,
                updated_at: now,
                updated_by: userId
            }, trx);

            const transactionPayload = {
                cab_id: cabId,
                item_id: item.id,
                created_by: userId,
                transaction_type: 'ADJUSTMENT',
                input_qty: Math.abs(difference),
                input_unit_id: item.base_unit_id,
                qty: difference,
                note: `[STOCK OPNAME] ${payload.note}`,
                created_at: now,
                updated_at: now
            };

            await inventoryTransactionRepository.create(transactionPayload, trx);

            return {
                item_name: item.name,
                old_stock: item.stock_available,
                new_stock: payload.actual_qty,
                difference: difference
            };
        });
    }

    async getLogTransactionsUser(query, request) {
        const cabId = getCabId(request);
        const userId = getUserId(request);

        const logs = await inventoryTransactionRepository.findAllWithFiltersUser(query, userId);
        return logs;
    }

    async stockOutUser(payload, request) {
        const userId = getUserId(request);
        // const cabId = getCabId(request);

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
                    cab_id: payload.cab_id,
                    item_id: item.id,
                    created_by: userId,
                    nik: payload.nik,
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
                        cab_id: payload.cab_id,
                        transaction_id: newTransaction.id,
                        item_id: item.id,
                        created_by: userId,
                        nik: payload.nik,
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