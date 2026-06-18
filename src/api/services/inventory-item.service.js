const inventoryItemRepository = require('../repositories/inventory-item.repository');
const inventoryTransactionRepository = require('../repositories/inventory-transaction.repository');
const { formatDateTime, getUserId, getCabId } = require("../helpers/dataHelpers");
const { knexBooking } = require('../../config/database');
const itemUomRepository = require('../repositories/item-uom.repository');
const ExcelJS = require('exceljs');
const moment = require('moment');
const bwipjs = require('bwip-js');

class InventoryItemService {

    async generateUniqueBarcode(cab_id) {
        let isUnique = false;
        let newBarcode = '';

        while (!isUnique) {
            const date = new Date();
            const ym = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
            const random = Math.floor(1000 + Math.random() * 9000);

            const cabStr = String(cab_id).padStart(2, '0');
            newBarcode = `${cabStr}${ym}${random}`;

            const existing = await inventoryItemRepository.findByBarcodeAndCabang(newBarcode, cab_id);
            if (!existing) {
                isUnique = true;
            }
        }

        return newBarcode;
    }

    async generateBarcodeImage(barcodeStr) {
        return new Promise((resolve, reject) => {
            bwipjs.toBuffer({
                bcid: 'code128',       // Code128 sangat stabil membaca angka/huruf tanpa butuh checksum rumit
                text: barcodeStr,      // Teks angka barcode
                scale: 3,              // Skala gambar (resolusi)
                height: 12,            // Tinggi garis barcode dalam milimeter
                includetext: true,     // INI YANG MEMUNCULKAN ANGKA DI BAWAH BARCODE
                textxalign: 'center',  // Posisi teks di tengah
                textyoffset: -5,        // Offset teks dari garis barcode
                textsize: 12,           // Ukuran teks
                paddingwidth: 20,
                paddingheight: 20,
            }, function (err, png) {
                if (err) {
                    reject(err);
                } else {
                    resolve(png); // Mengembalikan buffer file PNG
                }
            });
        });
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
            const isDeletable = await inventoryItemRepository.checkDeletable(id);

            if (!isDeletable) {
                const error = new Error('Item ini tidak bisa dihapus karena sudah memiliki riwayat transaksi.');
                error.statusCode = 400;
                throw error;
            }
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

    async exportToExcel(queryParams, request) {
        const items = await inventoryItemRepository.findAllForExport(queryParams);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Master Barang');

        worksheet.columns = [
            { header: 'ID Barang', key: 'id', width: 12 },
            { header: 'Barcode', key: 'barcode', width: 20 },
            { header: 'Nama Barang', key: 'name', width: 40 },
            { header: 'Kategori', key: 'category', width: 25 },
            { header: 'Jenis Barang', key: 'item_type', width: 20 },
            { header: 'Stok Tersedia', key: 'stock_available', width: 15 },
            { header: 'Stok Minimum', key: 'stock_minimum', width: 15 },
            { header: 'Satuan (Base)', key: 'base_unit', width: 15 },
            { header: 'Status Stok', key: 'status_stok', width: 15 },
            { header: 'Ukuran', key: 'size', width: 15 },
            { header: 'Warna', key: 'color', width: 15 },
            { header: 'Dibuat Pada', key: 'created_at', width: 22 },
        ];

        worksheet.getRow(1).font = { bold: true };

        items.forEach(item => {
            const itemTypeStr = item.item_type === 1 ? 'BHP' : 'Asset / Pinjaman';
            const statusStokStr = item.stock_available > 0 ? 'Ready' : 'Habis';

            worksheet.addRow({
                id: item.id,
                barcode: item.barcode,
                name: item.name,
                category: item.category ? item.category.name : '-',
                item_type: itemTypeStr,
                stock_available: item.stock_available,
                stock_minimum: item.stock_minimum,
                base_unit: item.base_unit ? item.base_unit.name : '-',
                status_stok: statusStokStr,
                size: item.size || '-',
                color: item.color || '-',
                created_at: item.created_at ? moment(item.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
            });
        });

        return workbook;
    }
}

module.exports = new InventoryItemService();