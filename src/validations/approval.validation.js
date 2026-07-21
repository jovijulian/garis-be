const { z } = require('zod');

const approvalIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Approval ID must be a number' }),
    }),
});

const approvalSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED'], { required_error: 'Status is required' }),
        notes: z.string().optional().nullable(),
        forward_to_head1: z.boolean().optional().default(false) // Trigger untuk lanjut ke head1
    })
});

module.exports = {
    approvalIdSchema,
    approvalSchema
};