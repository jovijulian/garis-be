const { z } = require('zod');

const orderDetailSchema = z.object({
    consumption_type_id: z.number({ required_error: 'Consumption Type ID is required' }),
    menu: z.string({ required_error: 'Menu is required' }),
    qty: z.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
    delivery_time: z.string({ required_error: 'Delivery time is required' }),
});

const createSchema = z.object({
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number().optional().nullable(),
        booking_id: z.number().optional().nullable(),
        location_text: z.string().optional().nullable(),
        pax: z.number({ required_error: 'Pax is required' }).min(1, { message: 'Pax must be at least 1' }),
        order_date: z.string({ required_error: 'Order date is required' }),
        details: z.array(orderDetailSchema).min(1, { message: 'Order must have at least one menu item.' }),
        status: z.enum(['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled']).optional().nullable(),
        note: z.string().optional().nullable(),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Order ID must be a number' }),
    }),
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number().optional().nullable(),
        booking_id: z.number().optional().nullable(),
        location_text: z.string().optional().nullable(),
        pax: z.number({ required_error: 'Pax is required' }).min(1, { message: 'Pax must be at least 1' }),
        order_date: z.string({ required_error: 'Order date is required' }),
        details: z.array(orderDetailSchema).min(1, { message: 'Order must have at least one menu item.' }),
        status: z.enum(['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled']).optional().nullable(),
        note: z.string().optional().nullable(),
    }),
});

const orderIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Order ID must be a number' }),
    }),
});

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