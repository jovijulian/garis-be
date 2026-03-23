const { z } = require('zod');

const inventoryItemBody = {
    cab_id: z.number({ required_error: 'Cabang ID is required', invalid_type_error: 'Cabang ID must be a number' }).int(),
    category_id: z.number({ required_error: 'Category ID is required', invalid_type_error: 'Category ID must be a number' }).int(),
    barcode: z.string().optional().or(z.literal('')).nullable(), 
    name: z.string({ required_error: 'Item name is required' }).min(1, 'Item name cannot be empty'),
    item_type: z.union([z.literal(1), z.literal(2)], { 
        required_error: 'Item type is required',
        invalid_type_error: 'Item type must be exactly 1 (BHP) atau 2 (Pinjaman)'
    }),
    stock_minimum: z.number({ required_error: 'Stock minimum is required' })
        .int()
        .min(0, 'Stock minimum cannot be negative'),
        
    base_unit_id: z.number({ required_error: 'Base unit ID is required' }).int(),
    pack_unit_id: z.number().int().optional().nullable(),
    qty_per_pack: z.number().int().min(1, 'Qty per pack must be at least 1').optional().nullable(),
    
    initial_qty: z.number().int().min(0, 'Initial Qty cannot be negative').optional().nullable(),
    initial_unit_id: z.number().int().optional().nullable(),
    
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
        pack_unit_id: inventoryItemBody.pack_unit_id.optional().nullable(), 
        qty_per_pack: inventoryItemBody.qty_per_pack.optional().nullable(), 
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