const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Unit name is required' }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Inventory Unit ID must be a number' }),
    }),
    body: z.object({
        name: z.string({ required_error: 'Inventory Unit name is required' }),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const inventoryUnitIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Inventory Unit ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    inventoryUnitIdSchema,
};