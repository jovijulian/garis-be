const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
const itemUomRepository = require('../repositories/item-uom.repository');

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
        const data = await inventoryItemRepository.findByIdWithRelations(id, '[cabang, category, base_unit, uoms.[unit], created_by_user, updated_by_user]');
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

            const uomConversions = payload.uoms || [];

            delete payload.uoms;

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
                    const error = new Error(`Barcode ${payload.barcode} sudah terdaftar.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            const newItem = await inventoryItemRepository.create(payload, trx);

            if (uomConversions.length > 0) {
                const uomDataToInsert = uomConversions.map(uom => ({
                    item_id: newItem.id,
                    unit_id: uom.unit_id,
                    multiplier: uom.multiplier
                }));
                await itemUomRepository.createItemUom(uomDataToInsert, trx);
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

            const uomConversions = payload.uoms;
            delete payload.uoms;

            if (payload.barcode) {
                const existing = await inventoryItemRepository.findByBarcodeAndCabang(payload.barcode, cabId);
                if (existing && existing.id !== Number(id)) {
                    const error = new Error(`Barcode ${payload.barcode} sudah digunakan oleh barang lain.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            const updatedItem = await inventoryItemRepository.update(id, payload, trx);

            if (uomConversions !== undefined) {
                await itemUomRepository.deleteByItemId(id, trx);

                if (uomConversions.length > 0) {
                    const uomDataToInsert = uomConversions.map(uom => ({
                        item_id: Number(id),
                        unit_id: uom.unit_id,
                        multiplier: uom.multiplier
                    }));
                    await itemUomRepository.createItemUom(uomDataToInsert, trx);
                }
            }

            return updatedItem;
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
                const uomConversions = payload.uoms || [];
                delete payload.uoms;

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
                if (uomConversions.length > 0) {
                    const uomDataToInsert = uomConversions.map(uom => ({
                        item_id: newItem.id,
                        unit_id: uom.unit_id,
                        multiplier: uom.multiplier
                    }));
                    await itemUomRepository.createItemUom(uomDataToInsert, trx);
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