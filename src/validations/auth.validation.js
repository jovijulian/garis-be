const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Not a valid email' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  }),
});


const changePasswordSchema = z.object({
  body: z.object({
    old_password: z.string({ required_error: 'Old password is required' }),
    new_password: z.string({ required_error: 'New Password is required' }),
  }),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};