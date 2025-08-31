const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        roomId: z.number({ required_error: 'Room is required' }),
        purpose: z.string({ required_error: 'Purpose is required' }),
        bookingDate: z.string({ required_error: 'Booking date is required' }).refine(date => !isNaN(Date.parse(date)), {
            message: 'Invalid date format',
        }),
        startTime: z.string({ required_error: 'Start Time is required' }),
        durationMinutes: z.number({ required_error: 'Duration is required' })
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Booking ID must be a number' }),
    }),
    body: z.object({
        roomId: z.number({ required_error: 'Room is required' }),
        purpose: z.string({ required_error: 'Purpose is required' }),
        bookingDate: z.string({ required_error: 'Booking date is required' }).refine(date => !isNaN(Date.parse(date)), {
            message: 'Invalid date format',
        }),
        startTime: z.string({ required_error: 'Start time is required' }).regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:mm format' }),
        durationMinutes: z.number({ required_error: 'Duration is required' }).min(15, { message: 'Duration must be at least 15 minutes' }),
        status: z.enum(['Submit', 'Approved', 'Rejected']).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const bookingIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Booking ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    bookingIdSchema,
};