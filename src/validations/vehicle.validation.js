const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Vehicle name is required',
        }).min(1, 'Vehicle name cannot be empty'),

        vehicle_type_id: z.number({
            required_error: 'Vehicle type ID is required',
            invalid_type_error: 'Vehicle type ID must be a number',
        }).int().positive('Vehicle type ID must be a positive number'),

        license_plate: z.string({
            required_error: 'License plate is required',
        }).min(3, 'License plate must be at least 3 characters')
            .max(15, 'License plate cannot be more than 15 characters')
            .transform(val => val.toUpperCase().replace(/\s/g, '')),

        passenger_capacity: z.number({
            required_error: 'Passenger capacity is required',
            invalid_type_error: 'Passenger capacity must be a number',
        }).int().positive('Passenger capacity must be a positive number'),
        is_operational: z.number(),
        cab_id: z.number().nullable().optional(),
        department_ids: z.array(z.number()).optional().nullable(),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Vehicle ID must be a number' }),
    }),
    body: z.object({
        name: z.string({
            required_error: 'Vehicle name is required',
        }).min(1, 'Vehicle name cannot be empty'),

        vehicle_type_id: z.number({
            required_error: 'Vehicle type ID is required',
            invalid_type_error: 'Vehicle type ID must be a number',
        }).int().positive('Vehicle type ID must be a positive number'),

        license_plate: z.string({
            required_error: 'License plate is required',
        }).min(3, 'License plate must be at least 3 characters')
            .max(15, 'License plate cannot be more than 15 characters')
            .transform(val => val.toUpperCase().replace(/\s/g, '')),

        passenger_capacity: z.number({
            required_error: 'Passenger capacity is required',
            invalid_type_error: 'Passenger capacity must be a number',
        }).int().positive('Passenger capacity must be a positive number'),
        is_operational: z.number(),
        cab_id: z.number().nullable().optional(),
        department_ids: z.array(z.number()).optional().nullable(),
    }),
});

const updateStatusSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Vehicle ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['Available', 'Not Available', 'In Repair'], {
            required_error: 'Status is required',
            invalid_type_error: "Status must be one of: 'Available', 'Not Available', 'In Repair'",
        }),
    }),
});

const vehicleIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: 'Vehicle ID must be a number' }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    vehicleIdSchema,
    updateStatusSchema
};