const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Transport type name is required' }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Transport type ID must be a number' }),
    }),
    body: z.object({
        name: z.string({ required_error: 'Transport type name is required' }),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const transportTypeIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Transport type ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    transportTypeIdSchema,
};