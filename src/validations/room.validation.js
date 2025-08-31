const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Room name is required' }),
        description: z.string().nullable().optional(),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Room ID must be a number' }),
    }),
    body: z.object({
        name: z.string({ required_error: 'Room name is required' }),
        description: z.string().nullable().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const roomIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Room ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    roomIdSchema,
};