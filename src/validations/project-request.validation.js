const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        cab_id: z.coerce.number().optional().nullable(),
        problem_description: z.string({ required_error: 'Problem description is required' })
            .min(10, { message: 'Problem description must be at least 10 characters' }),
        root_cause: z.string().optional().nullable(),
        corrective_action: z.string().optional().nullable(),
    })
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        cab_id: z.coerce.number().optional().nullable(),
        problem_description: z.string().min(10).optional(),
        root_cause: z.string().nullable().optional(),
        corrective_action: z.string().nullable().optional(),
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
        forward_to_head1: z.boolean().optional().default(false) // Trigger untuk lanjut ke head1
    })
});

const progressSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).min(3),
        description: z.string({ required_error: 'Description is required' }).min(5),
    })
});

const verificationSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Request ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['CLOSED', 'REVISION'], { required_error: 'Status is required (CLOSED or REVISION)' }),
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
    }).refine(data => {
        if (data.status === 'REVISION') {
            if (!data.title || data.title.trim() === '') return false;
            if (!data.description || data.description.trim() === '') return false;
        }
        return true;
    }, {
        message: 'Title and description are strictly required when requesting a revision',
        path: ['description']
    })
});

module.exports = {
    createSchema,
    updateSchema,
    requestIdSchema,
    approvalSchema,
    progressSchema,
    verificationSchema
};