const { z } = require('zod');

const assignVehicleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
    body: z.object({
        vehicle_id: z.number({
            required_error: 'vehicle_id is required'
        }).int().positive()
    })
});

const assignDriverSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
    body: z.object({
        driver_id: z.number({
            required_error: 'driver_id is required'
        }).int().positive()
    })
});

const detailAssignSchema = z.object({
    request_id: z.number({ required_error: 'Request ID is required' }),
    vehicle_id: z.number().int().nonnegative().optional().nullable(),
    driver_id: z.number().int().nonnegative().optional().nullable(),
    note_for_driver: z.string().optional().nullable(),
});

const assignSchema = z.object({
    params: z.object({
        requestId: z.string().regex(/^\d+$/, { message: 'Request ID must be a number' }),
    }),
    body: z.object({
        details: z.array(detailAssignSchema).min(1, { message: 'Request must have at least one assignment item.' }),
    }),
});

const removeAssignmentSchema = z.object({
    params: z.object({
        assignment_id: z.string().regex(/^\d+$/, { message: 'Assignment ID must be a number' }),
    }),
});

module.exports = {
    assignVehicleSchema,
    assignDriverSchema,
    removeAssignmentSchema,
    assignSchema
};