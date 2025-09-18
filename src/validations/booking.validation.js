const { z } = require('zod');

const createSchema = z.object({
    body: z.object({
        room_id: z.number({ required_error: 'Room ID is required' }),
        topic_id: z.number({ required_error: 'Topic ID is required' }),
        detail_topic: z.string().optional().nullable(),
        purpose: z.string({ required_error: 'Purpose is required' }).min(3, { message: 'Purpose must be at least 3 characters' }),
        start_time: z.string({ required_error: 'Start time is required' }),
        end_time: z.string({ required_error: 'End time is required' }),
        notes: z.string().optional().nullable(),
        amenity_ids: z.array(z.number()).optional().nullable(),
    }).refine((data) => new Date(data.start_time) < new Date(data.end_time), {
        message: 'End time must be after start time',
        path: ['end_time'], 
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Booking ID must be a number' }),
    }),
    body: z.object({
        room_id: z.number().optional(),
        topic_id: z.number().optional(),
        detail_topic: z.string().optional().nullable(),
        purpose: z.string().min(3).optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        notes: z.string().nullable().optional(), 
        amenity_ids: z.array(z.number()).optional(),
    }).refine((data) => {
        if (data.start_time && data.end_time) {
            return new Date(data.start_time) < new Date(data.end_time);
        }
        return true;
    }, {
        message: 'End time must be after start time',
        path: ['end_time'],
    })
});

// Schema untuk validasi parameter ID saja
const bookingIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Booking ID must be a number' }),
    }),
});

// Schema untuk update status oleh admin
const updateStatusSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'Booking ID must be a number' }),
    }),
    body: z.object({
        status: z.enum(['Approved', 'Rejected'], { required_error: 'Status is required' }),
    }),
});


module.exports = {
    createSchema,
    updateSchema,
    bookingIdSchema,
    updateStatusSchema,
};