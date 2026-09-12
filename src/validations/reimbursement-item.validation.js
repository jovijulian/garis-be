const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        item_name: z.string({ required_error: ' Item name is required' }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Item ID must be a number' }),
    }),
    body: z.object({
        item_name: z.string({ required_error: 'Item name is required' }),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const itemIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Item ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    itemIdSchema,
};