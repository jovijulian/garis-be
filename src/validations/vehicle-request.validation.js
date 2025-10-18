const { z } = require('zod');

const requestBodySchema = z.object({
    cab_id: z.number().int().positive().optional().nullable(),
    pickup_location_text: z.string().min(5).optional().nullable(),
    destination: z.string({
        required_error: 'Destination is required'
    }).min(3, 'Destination must be at least 3 characters'),
    start_time: z.string({
        required_error: 'Start time is required'
    }).datetime({ message: 'Invalid datetime format for start_time (must be ISO 8601)' }),
    end_time: z.string({
        required_error: 'End time is required'
    }).datetime({ message: 'Invalid datetime format for end_time (must be ISO 8601)' }),
    passenger_count: z.number({
        required_error: 'Passenger count is required'
    }).int().positive('Passenger count must be a positive number'),
    passenger_names: z.string().optional().nullable(),
    requested_vehicle_type_id: z.number({
        required_error: 'Requested vehicle type ID is required'
    }).int().positive(),
    requested_vehicle_count: z.number({
        required_error: 'Requested vehicle count is required'
    }).int().positive(),
    purpose: z.string({
        required_error: 'Purpose of the request is required'
    }).min(5, 'Purpose must be at least 5 characters'),
    note: z.string().optional().nullable(),
    id_user: z.string().optional()
})
.refine(data => data.cab_id || data.pickup_location_text, {
    message: 'Either Cabang ID or Pickup Location Text must be provided',
    path: ['cab_id', 'pickup_location_text'], 
});


const createRequestSchema = z.object({
    body: requestBodySchema
});

const updateRequestSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
    body: requestBodySchema.partial() 
        .refine(data => Object.keys(data).length > 0, {
            message: 'At least one field must be provided for an update',
        })
});

const updateStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['Approved', 'Rejected', 'Completed', 'Canceled', 'In Progress'], { 
             required_error: 'Status is required'
        }),
        rejection_reason: z.string().optional().nullable()
    })
});

const requestIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
});

module.exports = {
    createRequestSchema,
    updateRequestSchema,
    updateStatusSchema,
    requestIdSchema
};