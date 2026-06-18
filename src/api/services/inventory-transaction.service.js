const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryLoanRepository = require('../repositories/inventory-loan.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
const ExcelJS = require('exceljs');
const moment = require('moment');
class InventoryTransactionService {

    async stockIn(payload, request) {
        const getUser = getUserId(request);
        const cabId = getCabId(request);

        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();

            const item = await inventoryItemRepository.findByIdWithRelations(payload.item_id, '[uoms]');
            if (!item) {
                const error = new Error('Inventory Item tidak ditemukan.');
                error.statusCode = 404;
                throw error;
            }

            const inputQty = parseInt(payload.input_qty);
            let baseQtyToAdd = 0;

            if (payload.input_unit_id === item.base_unit_id) {
                baseQtyToAdd = inputQty;
            } else {
                const matchedUom = item.uoms?.find(u => u.unit_id === payload.input_unit_id);
                if (matchedUom) {
                    baseQtyToAdd = inputQty * matchedUom.multiplier;
                } else {
                    throw new Error('Satuan input tidak terdaftar pada konfigurasi konversi barang ini.');
                }
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
                updated_at: now,
                user_id: getUser,
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
                const item = await inventoryItemRepository.findByIdWithRelations(reqItem.item_id, '[uoms]');
                if (!item) {
                    const error = new Error(`Barang dengan ID ${reqItem.item_id} tidak ditemukan.`);
                    error.statusCode = 404;
                    throw error;
                }

                const inputQty = parseInt(reqItem.input_qty);
                let baseQtyToDeduct = 0;

                if (reqItem.input_unit_id === item.base_unit_id) {
                    baseQtyToDeduct = inputQty;
                } else {
                    const matchedUom = item.uoms?.find(u => u.unit_id === reqItem.input_unit_id);
                    if (matchedUom) {
                        baseQtyToDeduct = inputQty * matchedUom.multiplier;
                    } else {
                        const error = new Error(`Satuan input tidak sesuai dengan konfigurasi barang: ${item.name}`);
                        error.statusCode = 400;
                        throw error;
                    }
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
                    nik: null,
                    transaction_type: trxType,
                    input_qty: inputQty,
                    input_unit_id: reqItem.input_unit_id,
                    qty: baseQtyToDeduct,
                    note: payload.note || 'Pengeluaran Barang (Stock Out)',
                    created_at: now,
                    updated_at: now,
                    user_id: payload.user_id || userId,
                };

                const newTransaction = await inventoryTransactionRepository.create(transactionPayload, trx);

                if (isAsset) {
                    const loanPayload = {
                        cab_id: cabId,
                        transaction_id: newTransaction.id,
                        item_id: item.id,
                        created_by: userId,
                        nik: null,
                        qty_borrowed: baseQtyToDeduct,
                        qty_returned: 0,
                        status: 'BORROWED',
                        borrowed_at: now,
                        user_id: payload.user_id || userId,
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

            const item = await inventoryItemRepository.findByIdWithRelations(loan.item_id, '[uoms]');
            if (!item) throw new Error("Data barang tidak ditemukan.");

            const inputQty = parseInt(payload.return_qty);
            let baseQtyReturned = 0;

            if (payload.input_unit_id === item.base_unit_id) {
                baseQtyReturned = inputQty;
            } else {
                const matchedUom = item.uoms?.find(u => u.unit_id === payload.input_unit_id);
                if (matchedUom) {
                    baseQtyReturned = inputQty * matchedUom.multiplier;
                } else {
                    throw new Error('Satuan pengembalian tidak terdaftar untuk barang ini.');
                }
            }

            const remainingToReturn = loan.qty_borrowed - loan.qty_returned;
            if (baseQtyReturned > remainingToReturn) {
                const error = new Error(`Gagal: Jumlah dikembalikan (${baseQtyReturned}) melebihi sisa pinjaman (${remainingToReturn}).`);
                error.statusCode = 400;
                throw error;
            }

            const newReturnedQty = loan.qty_returned + baseQtyReturned;
            const newStatus = newReturnedQty >= loan.qty_borrowed ? 'RETURNED' : 'PARTIAL_RETURNED';

            await inventoryLoanRepository.update(loan.id, {
                qty_returned: newReturnedQty,
                status: newStatus,
                returned_at: now
            }, trx);

            const newStock = item.stock_available + baseQtyReturned;
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
                input_qty: inputQty,
                input_unit_id: payload.input_unit_id,
                qty: baseQtyReturned,
                note: payload.note || 'Pengembalian Aset Inventaris',
                created_at: now,
                updated_at: now,
                user_id: userId,
            };
            await inventoryTransactionRepository.create(transactionPayload, trx);

            return {
                item_name: item.name,
                returned_base_qty: baseQtyReturned,
                status: newStatus
            };
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

            const item = await inventoryItemRepository.findByIdWithRelations(payload.item_id, '[uoms]');
            if (!item) {
                const error = new Error("Data barang tidak ditemukan.");
                error.statusCode = 404;
                throw error;
            }

            const inputQty = parseInt(payload.input_qty);
            let actualQtyInBase = 0;

            if (payload.input_unit_id === item.base_unit_id) {
                actualQtyInBase = inputQty;
            } else {
                const matchedUom = item.uoms?.find(u => u.unit_id === payload.input_unit_id);
                if (!matchedUom) {
                    throw new Error('Satuan penyesuaian tidak terdaftar pada konfigurasi barang ini.');
                }
                actualQtyInBase = inputQty * matchedUom.multiplier;
            }

            const difference = actualQtyInBase - item.stock_available;

            if (difference === 0) {
                const error = new Error("Penyesuaian ditolak. Stok fisik sudah sama dengan stok sistem.");
                error.statusCode = 400;
                throw error;
            }

            await inventoryItemRepository.update(item.id, {
                stock_available: Number(actualQtyInBase),
                updated_at: now,
                updated_by: userId,
            }, trx);

            const transactionPayload = {
                cab_id: cabId,
                item_id: item.id,
                created_by: userId,
                transaction_type: 'ADJUSTMENT',
                input_qty: inputQty,
                input_unit_id: payload.input_unit_id,
                qty: difference,
                note: `[STOCK OPNAME] ${payload.note}`,
                created_at: now,
                updated_at: now,
                user_id: userId,
            };

            await inventoryTransactionRepository.create(transactionPayload, trx);

            return {
                item_name: item.name,
                old_stock: item.stock_available,
                new_stock: actualQtyInBase,
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

        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();
            const results = [];

            for (let i = 0; i < payload.items.length; i++) {
                const reqItem = payload.items[i];
                const item = await inventoryItemRepository.findByIdWithRelations(reqItem.item_id, '[uoms]');
                if (!item) {
                    const error = new Error(`Barang dengan ID ${reqItem.item_id} tidak ditemukan.`);
                    error.statusCode = 404;
                    throw error;
                }

                const inputQty = parseInt(reqItem.input_qty);
                let baseQtyToDeduct = 0;

                if (reqItem.input_unit_id === item.base_unit_id) {
                    baseQtyToDeduct = inputQty;
                } else {
                    const matchedUom = item.uoms?.find(u => u.unit_id === reqItem.input_unit_id);
                    if (matchedUom) {
                        baseQtyToDeduct = inputQty * matchedUom.multiplier;
                    } else {
                        const error = new Error(`Satuan input tidak sesuai dengan konfigurasi barang: ${item.name}`);
                        error.statusCode = 400;
                        throw error;
                    }
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
                    nik: null,
                    transaction_type: trxType,
                    input_qty: inputQty,
                    input_unit_id: reqItem.input_unit_id,
                    qty: baseQtyToDeduct,
                    note: payload.note || 'Pengeluaran Barang (Stock Out)',
                    created_at: now,
                    updated_at: now,
                    user_id: userId,
                };

                const newTransaction = await inventoryTransactionRepository.create(transactionPayload, trx);

                if (isAsset) {
                    const loanPayload = {
                        cab_id: payload.cab_id,
                        transaction_id: newTransaction.id,
                        item_id: item.id,
                        created_by: userId,
                        nik: null,
                        qty_borrowed: baseQtyToDeduct,
                        qty_returned: 0,
                        status: 'BORROWED',
                        borrowed_at: now,
                        user_id: userId,
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

    async exportToExcel(queryParams, request) {
        const cabId = getCabId(request); 

        const transactions = await inventoryTransactionRepository.findAllForExport(queryParams, cabId);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Transaksi Inventaris');

        worksheet.columns = [
            { header: 'ID Transaksi', key: 'id', width: 12 },
            { header: 'Tanggal', key: 'created_at', width: 22 },
            { header: 'Cabang', key: 'cabang', width: 20 },
            { header: 'Tipe Transaksi', key: 'transaction_type', width: 20 },
            { header: 'Nama Barang', key: 'item_name', width: 40 },
            { header: 'Barcode', key: 'barcode', width: 20 },
            { header: 'Jenis Barang', key: 'item_type', width: 15 },
            { header: 'Qty Input', key: 'input_qty', width: 12 },
            { header: 'Satuan Input', key: 'input_unit', width: 15 },
            { header: 'Qty (Base)', key: 'qty_base', width: 12 },
            { header: 'Satuan (Base)', key: 'base_unit', width: 15 },
            { header: 'Penerima / User', key: 'user_name', width: 30 },
            { header: 'Dibuat Oleh', key: 'created_by_name', width: 30 },
            { header: 'Catatan', key: 'note', width: 50 },
        ];

        worksheet.getRow(1).font = { bold: true };

        transactions.forEach(trx => {
            const itemTypeStr = trx.item ? (trx.item.item_type === 1 ? 'BHP' : 'Asset') : '-';

            const userName = trx.user
                ? (trx.user.employee ? trx.user.employee.nama : trx.user.nama_user)
                : '-';

            worksheet.addRow({
                id: trx.id,
                created_at: trx.created_at ? moment(trx.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
                cabang: trx.cabang ? trx.cabang.nama_cab : '-',
                transaction_type: trx.transaction_type,
                item_name: trx.item ? trx.item.name : '-',
                barcode: trx.item ? trx.item.barcode : '-',
                item_type: itemTypeStr,
                input_qty: trx.input_qty,
                input_unit: trx.unit ? trx.unit.name : '-',
                qty_base: trx.qty,
                base_unit: (trx.item && trx.item.base_unit) ? trx.item.base_unit.name : '-',
                user_name: userName,
                created_by_name: trx.created_by_user ? trx.created_by_user.nama_user : '-',
                note: trx.note || '-',
            });
        });

        return workbook;
    }
}

module.exports = new InventoryTransactionService();