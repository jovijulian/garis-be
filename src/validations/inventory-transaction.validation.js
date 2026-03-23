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
        user_id_borrower: z.string({ required_error: 'User / NIK peminta wajib diisi' }).nullable().optional(),
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

module.exports = {
    stockInSchema,
    stockOutSchema,
};