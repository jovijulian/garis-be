const { z } = require('zod');

const visitorOrderItemSchema = z.object({
    consumption_type_id: z.number({ required_error: 'Tipe konsumsi wajib diisi' }),
    qty: z.number().min(1, 'Minimal qty 1'),
    menu: z.string().optional().nullable(), 
});

const bookingDetailsSchema = z.object({
    room_id: z.number().optional().nullable(), 
    topic_id: z.number({ required_error: 'Topic ID wajib diisi' }), 
    purpose: z.string().min(3, 'Keperluan wajib diisi'),
    date: z.string({ required_error: 'Tanggal wajib diisi (YYYY-MM-DD)' }),
    time: z.string({ required_error: 'Jam Sampai wajib diisi (HH:mm)' }),
    duration: z.number().default(1),
    notes: z.string().optional()
});

const orderDetailsSchema = z.object({
    cab_id: z.number({ required_error: 'Cabang ID wajib diisi' }),
    location_text: z.string().optional().nullable(),
    date: z.string({ required_error: 'Tanggal Order wajib diisi' }),
    time: z.string({ required_error: 'Jam Sajian wajib diisi' }),
    items: z.array(visitorOrderItemSchema).min(1, 'Minimal 1 item jika order aktif'),
    notes: z.string().optional().nullable(),
    purpose: z.string().optional().nullable(),
});

const createVisitorSubmissionSchema = z.object({
    body: z.object({
        booking: bookingDetailsSchema.optional().nullable(),
        order: orderDetailsSchema.optional().nullable(),
    }).refine((data) => data.booking || data.order, {
        message: "Minimal harus ada data Booking atau data Order",
        path: ["root"] 
    })
});

module.exports = {
    createVisitorSubmissionSchema
};