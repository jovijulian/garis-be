const { z } = require('zod');

const stockInSchema = z.object({
    body: z.object({
        item_id: z.number({
            required_error: 'Item ID is required',
            invalid_type_error: 'Item ID must be a number'
        }).int().positive('Item ID must be valid'),

        input_qty: z.number({
            required_error: 'Input Qty is required',
            invalid_type_error: 'Input Qty must be a number'
        }).int().positive('Input Qty harus lebih besar dari 0'),

        input_unit_id: z.number({
            required_error: 'Input Unit ID is required',
            invalid_type_error: 'Input Unit ID must be a number'
        }).int().positive('Input Unit ID must be valid'),

        note: z.string().optional().nullable()
    })
});
const stockOutSchema = z.object({
    body: z.object({
        nik: z.string({ required_error: 'NIK peminta wajib diisi' }).min(1),
        note: z.string().optional().nullable(),
        items: z.array(
            z.object({
                item_id: z.number({ required_error: 'Item ID is required' }).int().positive(),
                input_qty: z.number({ required_error: 'Qty is required' }).int().positive('Qty harus lebih besar dari 0'),
                input_unit_id: z.number({ required_error: 'Unit ID is required' }).int().positive()
            })
        ).min(1, 'Keranjang kosong. Minimal satu barang harus dipilih untuk dikeluarkan.')
    })
});

const stockOutUserSchema = z.object({
    body: z.object({
        nik: z.string({ required_error: 'NIK peminta wajib diisi' }).min(1),
        note: z.string().optional().nullable(),
        cab_id: z.number({ required_error: 'Cabang ID is required' }).int().positive(),
        items: z.array(
            z.object({
                item_id: z.number({ required_error: 'Item ID is required' }).int().positive(),
                input_qty: z.number({ required_error: 'Qty is required' }).int().positive('Qty harus lebih besar dari 0'),
                input_unit_id: z.number({ required_error: 'Unit ID is required' }).int().positive()
            })
        ).min(1, 'Keranjang kosong. Minimal satu barang harus dipilih untuk dikeluarkan.')
    })
});

const returnAssetSchema = z.object({
    body: z.object({
        loan_id: z.number({ required_error: 'ID Pinjaman wajib diisi' }).int().positive(),
        return_qty: z.number({ required_error: 'Qty kembali wajib diisi' }).int().positive(),
        note: z.string().optional().nullable()
    })
});

const adjustStockSchema = z.object({
    body: z.object({
        item_id: z.number({ required_error: 'ID Barang wajib diisi' }).int().positive(),
        actual_qty: z.number({ required_error: 'Stok aktual wajib diisi' }).int().min(0, "Stok tidak boleh minus"),
        note: z.string({ required_error: 'Alasan penyesuaian wajib diisi' }).min(5, "Berikan alasan yang jelas (min 5 karakter)")
    })
});

module.exports = {
    stockInSchema,
    stockOutSchema,
    returnAssetSchema,
    adjustStockSchema,
    stockOutUserSchema
};