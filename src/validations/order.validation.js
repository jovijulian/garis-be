const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        user_id: z.number().optional().nullable(),
        cab_id: z.number().optional().nullable(),
        booking_id: z.number().optional().nullable(),
        room_id: z.number().optional().nullable(),
        location_text: z.string().optional().nullable(),
        consumption_type_id: z.number({ required_error: 'Consumption Type ID is required' }),
        pax: z.number({ required_error: 'Pax is required' }).min(1, { message: 'Pax must be at least 1' }),
        order_time: z.string({ required_error: 'Order time is required' }),
        menu_description: z.string().optional().nullable(),
        status: z.enum(['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled']).optional().nullable(),
        note: z.string().optional().nullable(),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Order ID must be a number' }),
    }),
    body: z.object({
        user_id: z.number().optional().nullable(),
        cab_id: z.number().optional().nullable(),
        booking_id: z.number().optional().nullable(),
        room_id: z.number().optional().nullable(),
        location_text: z.string().optional().nullable(),
        consumption_type_id: z.number({ required_error: 'Consumption Type ID is required' }),
        pax: z.number({ required_error: 'Pax is required' }).min(1, { message: 'Pax must be at least 1' }),
        order_time: z.string({ required_error: 'Order time is required' }),
        menu_description: z.string().optional().nullable(),
        status: z.enum(['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled']).optional().nullable(),
        note: z.string().optional().nullable(),
    }),
});

const orderIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Order ID must be a number' }),
    }),
});

// Schema untuk update status oleh admin
const updateStatusSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Order ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['Approved', 'Rejected', 'Completed', 'Canceled'], { required_error: 'Status is required' }),
    }),
});


module.exports = {
    createSchema,
    updateSchema,
    orderIdSchema,
    updateStatusSchema,
};