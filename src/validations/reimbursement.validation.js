const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        cab_id: z.coerce.number({ required_error: 'Cabang ID is required' }),
        destination: z.string({ required_error: 'Destination is required' }),
        start_date: z.string({ required_error: 'Start date is required' }),
        end_date: z.string({ required_error: 'End date is required' }),
        duration: z.coerce.number({ required_error: 'Duration is required' }),
        duration_type: z.enum(['Hari', 'Malam'], { required_error: 'Duration type is required' }),
        purpose: z.string({ required_error: 'Purpose is required' }),
        details: z.string().optional(), 
    })
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        cab_id: z.coerce.number().optional().nullable(),
        destination: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        duration: z.coerce.number().optional(),
        duration_type: z.enum(['Hari', 'Malam']).optional(),
        purpose: z.string().optional(),
        details: z.string().optional(),
    })
});

const requestIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
});

const approvalSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED'], { required_error: 'Status is required' }),
        notes: z.string().optional().nullable(),
        forward_to_head1: z.boolean().optional().default(false)
    })
});

module.exports = {
    createSchema,
    updateSchema,
    requestIdSchema,
    approvalSchema
};