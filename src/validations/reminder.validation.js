const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Reminder title is required' }),
        reminder_type_id: z.number({ required_error: 'Reminder type ID is required' }),
        due_date: z.string({ required_error: 'Due date is required' }),
        identity_number: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        is_recurring: z.number().nullable().optional(),
    }),
});
const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Reminder ID must be a number' }),
    }),
    body: z.object({
        title: z.string({ required_error: 'Reminder title is required' }),
        reminder_type_id: z.number({ required_error: 'Reminder type ID is required' }),
        due_date: z.string({ required_error: 'Due date is required' }),
        identity_number: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        is_recurring: z.number().nullable().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for an update',
    }),
});

const reminderIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Reminder ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    reminderIdSchema,
};