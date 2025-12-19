const { z } = require('zod');
const guestSchema = z.object({
    guest_name: z.string({ required_error: 'Nama tamu wajib diisi' })
        .min(1, 'Nama tamu tidak boleh kosong'),
    gender: z.enum(['Laki-laki', 'Perempuan'], { 
        required_error: 'Jenis kelamin wajib dipilih',
        invalid_type_error: 'Jenis kelamin harus "Laki-laki" atau "Perempuan"'
    }),
});
const createSchema = z.object({
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number({ required_error: 'Site/Cabang wajib dipilih' }),
        check_in_date: z.string({ required_error: 'Tanggal check-in wajib diisi' }),
        check_out_date: z.string({ required_error: 'Tanggal check-out wajib diisi' }),
        room_needed: z.string().optional().nullable(), 
        note: z.string().optional().nullable(),
        guests: z.array(guestSchema).min(1, { 
            message: 'Minimal harus memasukkan satu nama tamu.' 
        }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'ID Pesanan harus berupa angka' }),
    }),
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number().optional().nullable(),
        check_in_date: z.string().optional().nullable(),
        check_out_date: z.string().optional().nullable(),
        room_needed: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        guests: z.array(guestSchema).min(1, { 
            message: 'Jika mengubah tamu, minimal harus ada satu nama tamu.' 
        }).optional(),
    }),
});

const accommodationOrderIdSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'ID Pesanan harus berupa angka' }),
    }),
});

const updateStatusSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'ID Pesanan harus berupa angka' }),
    }),
    body: z.object({
        status: z.enum(['Approved', 'Rejected', 'Canceled'], { 
            required_error: 'Status persetujuan wajib diisi' 
        }),
    }),
});

module.exports = {
    createSchema,
    updateSchema,
    accommodationOrderIdSchema,
    updateStatusSchema,
};