const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');

class InventoryItemService {

    async generateUniqueBarcode(cab_id) {
        let isUnique = false;
        let newBarcode = '';

        while (!isUnique) {
            const date = new Date();
            const ym = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
            const random = Math.floor(1000 + Math.random() * 9000);

            newBarcode = `INV-${cab_id}-${ym}-${random}`;

            const existing = await inventoryItemRepository.findByBarcodeAndCabang(newBarcode, cab_id);
            if (!existing) {
                isUnique = true;
            }
        }

        return newBarcode;
    }

    async checkBarcode(barcode, cab_id) {
        const item = await inventoryItemRepository.findByBarcodeAndCabangWithRelations(barcode, cab_id);

        if (item) {
            return {
                is_existing: true,
                message: 'Barang ditemukan.',
                data: item
            };
        }

        return {
            is_existing: false,
            message: 'Barcode belum terdaftar. Silakan lengkapi pendaftaran barang baru.',
            data: null
        };
    }

    async getAll(queryParams) {
        return inventoryItemRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await inventoryItemRepository.findByIdWithRelations(id, '[cabang, category, base_unit, pack_unit, created_by_user, updated_by_user]');
        if (!data) {
            const error = new Error('Inventory Item not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(payload, request) {
        const getUser = getUserId(request);
        const cabId = getCabId(request);

        return await knexBooking.transaction(async (trx) => {
            const now = formatDateTime();

            const initialQty = payload.initial_qty ? parseInt(payload.initial_qty) : 0;
            const initialUnitId = payload.initial_unit_id || payload.base_unit_id;

            delete payload.initial_qty;
            delete payload.initial_unit_id;

            payload.created_at = now;
            payload.updated_at = now;
            payload.stock_available = 0;
            payload.created_by = getUser;
            payload.cab_id = cabId;

            if (!payload.barcode || payload.barcode.trim() === '') {
                payload.barcode = await this.generateUniqueBarcode(cabId);
            } else {
                const existing = await inventoryItemRepository.findByBarcodeAndCabang(payload.barcode, cabId);
                if (existing) {
                    const error = new Error(`Barcode ${payload.barcode} sudah terdaftar di cabang ini.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            const newItem = await inventoryItemRepository.create(payload, trx);

            if (initialQty > 0) {
                let baseQtyToAdd = 0;

                if (initialUnitId === newItem.pack_unit_id) {
                    baseQtyToAdd = initialQty * (newItem.qty_per_pack || 1);
                } else if (initialUnitId === newItem.base_unit_id) {
                    baseQtyToAdd = initialQty;
                } else {
                    throw new Error('Satuan stok awal tidak sesuai dengan konfigurasi barang ini.');
                }

                const transactionPayload = {
                    cab_id: cabId,
                    item_id: newItem.id,
                    created_by: getUser,
                    transaction_type: 'STOCK_IN',
                    input_qty: initialQty,
                    input_unit_id: initialUnitId,
                    qty: baseQtyToAdd,
                    note: payload.note,
                    created_at: now,
                    updated_at: now
                };

                await inventoryTransactionRepository.create(transactionPayload, trx);

                newItem.stock_available = baseQtyToAdd;
                await inventoryItemRepository.update(newItem.id, { stock_available: baseQtyToAdd }, trx);
            }

            return newItem;
        });
    }

    async update(id, payload, request) {
        await this.detail(id);
        const getUser = getUserId(request);
        const cabId = getCabId(request);

        return await knexBooking.transaction(async (trx) => {
            payload.updated_at = formatDateTime();
            payload.updated_by = getUser;

            if (payload.barcode) {
                const existing = await inventoryItemRepository.findByBarcodeAndCabang(payload.barcode, cabId);
                if (existing && existing.id !== Number(id)) {
                    const error = new Error(`Barcode ${payload.barcode} sudah digunakan oleh barang lain.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            return await inventoryItemRepository.update(id, payload, trx);
        });
    }

    async delete(id) {
        await this.detail(id);

        return await knexBooking.transaction(async (trx) => {
            const data = await inventoryItemRepository.update(id, { is_active: 0 }, trx);
            if (!data) {
                const error = new Error('Failed to delete inventory item.');
                error.statusCode = 500;
                throw error;
            }
            return { message: 'Inventory Item has been deleted successfully.' };
        });
    }

    async bulkCreate(payloads, request) {
        const getUser = getUserId(request);
        const cabId = getCabId(request);

        return await knexBooking.transaction(async (trx) => {
            const results = [];
            const now = formatDateTime();

            for (let [index, payload] of payloads.entries()) {
                const initialQty = payload.initial_qty ? parseInt(payload.initial_qty) : 0;
                const initialUnitId = payload.initial_unit_id || payload.base_unit_id;

                delete payload.initial_qty;
                delete payload.initial_unit_id;

                payload.created_at = now;
                payload.updated_at = now;
                payload.stock_available = 0;
                payload.created_by = getUser;
                payload.cab_id = cabId;

                if (!payload.barcode || payload.barcode.trim() === '') {
                    payload.barcode = await this.generateUniqueBarcode(cabId);
                } else {
                    const existing = await inventoryItemRepository.findByBarcodeAndCabang(payload.barcode, cabId);
                    if (existing) {
                        const error = new Error(`Gagal pada baris ${index + 1}: Barcode ${payload.barcode} sudah terdaftar.`);
                        error.statusCode = 400;
                        throw error;
                    }
                }

                const newItem = await inventoryItemRepository.create(payload, trx);

                if (initialQty > 0) {
                    let baseQtyToAdd = 0;
                    if (initialUnitId === newItem.pack_unit_id) {
                        baseQtyToAdd = initialQty * (newItem.qty_per_pack || 1);
                    } else if (initialUnitId === newItem.base_unit_id) {
                        baseQtyToAdd = initialQty;
                    } else {
                        throw new Error(`Gagal pada baris ${index + 1}: Satuan stok tidak sesuai.`);
                    }

                    const transactionPayload = {
                        cab_id: cabId,
                        item_id: newItem.id,
                        created_by: getUser,
                        transaction_type: 'STOCK_IN',
                        input_qty: initialQty,
                        input_unit_id: initialUnitId,
                        qty: baseQtyToAdd,
                        note: payload.note,
                        created_at: now,
                        updated_at: now
                    };

                    await inventoryTransactionRepository.create(transactionPayload, trx);

                    newItem.stock_available = baseQtyToAdd;
                    await inventoryItemRepository.update(newItem.id, { stock_available: baseQtyToAdd }, trx);
                }

                results.push(newItem);
            }

            return results;
        });
    }

    async options(query, request) {
        const cabId = getCabId(request);
        const search = query.search || '';

        const items = await inventoryItemRepository.options(cabId, search);
        if (!items || items.length === 0) {
            return [];
        }
        return items;
    }
}

module.exports = new InventoryItemService();