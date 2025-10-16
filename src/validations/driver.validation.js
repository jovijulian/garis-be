const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Driver name is required' }),
        id_user: z.string({ required_error: 'User ID is required' }),
        phone_number: z.string({ required_error: 'Phone number is required' }),
        cab_id: z.number(),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Driver ID must be a number' }),
    }),
    body: z.object({
        name: z.string({ required_error: 'Driver name is required' }),
        id_user: z.string({ required_error: 'User ID is required' }),
        phone_number: z.string({ required_error: 'Phone number is required' }),
        cab_id: z.number(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const driverIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Driver ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    driverIdSchema,
};