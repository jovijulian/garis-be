const { z } = require('zod');

const uomConversionSchema = z.object({
    unit_id: z.number({ required_error: 'Unit ID (Satuan) wajib diisi' }).int(),
    multiplier: z.number({ required_error: 'Multiplier wajib diisi' })
        .int()
        .min(1, 'Multiplier minimal bernilai 1')
});

const inventoryItemBody = {
    cab_id: z.number({ required_error: 'Cabang ID is required' }).int(),
    category_id: z.number({ required_error: 'Category ID is required' }).int(),
    barcode: z.string().optional().or(z.literal('')).nullable(), 
    name: z.string({ required_error: 'Item name is required' }).min(1),
    item_type: z.union([z.literal(1), z.literal(2)], { 
        required_error: 'Item type is required'
    }),
    stock_minimum: z.number({ required_error: 'Stock minimum is required' }).int().min(0),
    base_unit_id: z.number({ required_error: 'Base unit ID is required' }).int(),
    uoms: z.array(uomConversionSchema).optional().nullable(),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    style: z.string().optional().nullable(),
    version: z.string().optional().nullable(),
    is_active: z.union([z.literal(0), z.literal(1)]).optional().nullable(),
};

const createSchema = z.object({
    body: z.object(inventoryItemBody),
});

const bulkCreateSchema = z.object({
    body: z.array(z.object(inventoryItemBody)).min(1, 'Data array tidak boleh kosong. Minimal kirim 1 barang.'),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Inventory Item ID must be a valid number' }),
    }),
    body: z.object({
        cab_id: inventoryItemBody.cab_id.optional().nullable(),
        category_id: inventoryItemBody.category_id.optional().nullable(),
        barcode: z.string().optional().or(z.literal('')).nullable(),
        name: inventoryItemBody.name.optional().nullable(),
        item_type: inventoryItemBody.item_type.optional().nullable(),
        stock_minimum: inventoryItemBody.stock_minimum.optional().nullable(),
        base_unit_id: inventoryItemBody.base_unit_id.optional().nullable(),
        uoms: inventoryItemBody.uoms, 
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        style: z.string().optional().nullable(),
        version: z.string().optional().nullable(),
        is_active: inventoryItemBody.is_active
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const inventoryItemIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Inventory Item ID must be a valid number' }),
    }),
});

module.exports = {
    createSchema,
    bulkCreateSchema,
    updateSchema,
    inventoryItemIdSchema,
};