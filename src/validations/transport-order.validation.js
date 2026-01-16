const { z } = require('zod');
const passengerSchema = z.object({
    passenger_name: z.string({ required_error: 'Nama penumpang wajib diisi' })
        .min(1, 'Nama penumpang tidak boleh kosong'),
    phone_number: z.string().nullable().optional(),
});
const createSchema = z.object({
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number({ required_error: 'Site/Cabang wajib dipilih' }),
        transport_type_id: z.number({ required_error: 'Jenis Transport wajib dipilih' }),
        origin: z.string({ required_error: 'Asal penjemputan wajib diisi' }),
        origin_detail: z.string().optional().nullable(),
        destination: z.string({ required_error: 'Tujuan wajib diisi' }),
        destination_detail: z.string().optional().nullable(),
        date: z.string({ required_error: 'Tanggal pergi wajib diisi' }),
        time: z.string({ required_error: 'Waktu pergi wajib diisi' }),
        transport_class: z.string().optional().nullable(),
        preferred_provider: z.string().optional().nullable(),
        purpose: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        passengers: z.array(passengerSchema).min(1, {
            message: 'Minimal harus memasukkan satu nama penumpang.'
        }),
    }),
});

const updateSchema = z.object({
    params: z.object({
        id: z.coerce.number({ invalid_type_error: 'ID Pesanan harus berupa angka' }),
    }),
    body: z.object({
        user_id: z.string().optional().nullable(),
        cab_id: z.number({ required_error: 'Site/Cabang wajib dipilih' }),
        transport_type_id: z.number({ required_error: 'Jenis Transport wajib dipilih' }),
        origin: z.string({ required_error: 'Asal penjemputan wajib diisi' }),
        origin_detail: z.string().optional().nullable(),
        destination: z.string({ required_error: 'Tujuan wajib diisi' }),
        destination_detail: z.string().optional().nullable(),
        date: z.string({ required_error: 'Tanggal pergi wajib diisi' }),
        time: z.string({ required_error: 'Waktu pergi wajib diisi' }),
        transport_class: z.string().optional().nullable(),
        preferred_provider: z.string().optional().nullable(),
        purpose: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        passengers: z.array(passengerSchema).min(1, {
            message: 'Minimal harus memasukkan satu nama penumpang.'
        }),
    }),
});

const transportOrderIdSchema = z.object({
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
    transportOrderIdSchema,
    updateStatusSchema,
};