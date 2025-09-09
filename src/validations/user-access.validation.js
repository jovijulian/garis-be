const { z } = require('zod');

const updateUserAccessSchema = z.object({
    params: z.object({
        userId: z.string({ required_error: 'User ID is required' }).min(1, { message: 'User ID cannot be empty' }),
    }),

    body: z.object({
        role_garis: z.number({ required_error: 'role_garis is required' })
            .int()
            .min(1, { message: 'Invalid role' })
            .max(3, { message: 'Invalid role' }),
        role_name: z.string().optional().nullable(),
        sites:
            z.number().int().positive({ message: 'Site ID must be a positive number' }).
                optional().nullable(), 
    })
        .refine(data => {
            if (data.role_garis !== 2 && data.sites && data.sites.length > 0) {
                return false;
            }
            return true;
        }, {
            message: "Site assignments are only applicable for the 'Admin' role (role_garis = 2).",
            path: ["sites"],
        }),
});

module.exports = {
    updateUserAccessSchema,
};