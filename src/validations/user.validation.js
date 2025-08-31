const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(3),
    email: z.string({ required_error: 'Email is required' }).email({ message: 'Not a valid email' }),
    phone: z.string().optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email({ message: 'Not a valid email' }).optional(),
  }).refine(data => data.name || data.email, {
    message: "Either name or email must be provided for an update",
  }),
});

const userIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
};