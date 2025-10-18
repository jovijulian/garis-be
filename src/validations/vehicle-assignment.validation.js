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

const removeAssignmentSchema = z.object({
    params: z.object({
        assignment_id: z.string().regex(/^\d+$/, { message: 'Assignment ID must be a number' }),
    }),
});

module.exports = {
    assignVehicleSchema,
    assignDriverSchema,
    removeAssignmentSchema
};