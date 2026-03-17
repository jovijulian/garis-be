const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Reminder type name is required' }),
        notification_intervals: z.array(z.number(), { required_error: 'Notification interval is required' }).nonempty({ message: 'At least one notification interval is required' }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Reminder Type ID must be a number' }),
    }),
    body: z.object({
        name: z.string({ required_error: 'Reminder Type name is required' }),
        notification_intervals: z.array(z.number(), { required_error: 'Notification interval is required' }).nonempty({ message: 'At least one notification interval is required' }),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const reminderTypeIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Reminder Type ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    reminderTypeIdSchema,
};