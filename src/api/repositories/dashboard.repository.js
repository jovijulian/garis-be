const { knexBooking } = require('../../config/database');

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Topic = require('../models/Topic');
const OrderAmenity = require('../models/OrderAmenity');
const Order = require('../models/Order');
const ConsumptionType = require('../models/ConsumptionType');
const User = require('../models/User');
const OrderDetail = require('../models/OrderDetail');


class DashboardRepository {

    getTotalBookingsInRange(startDate, endDate) {
        return Booking.query().whereBetween('start_time', [startDate, endDate]).resultSize();
    }

    getPendingBookingsCount() {
        return Booking.query().where('status', 'Submit').resultSize();
    }

    async getMostPopularRoomInRange(startDate, endDate) {
        return Room.query()
            .select('rooms.name')
            .join('bookings', 'rooms.id', 'bookings.room_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('rooms.name')
            .orderBy(knexBooking.raw('count(bookings.id)'), 'desc')
            .first();
    }

    async getMostPopularTopicInRange(startDate, endDate) {
        return Topic.query()
            .select('topics.name')
            .join('bookings', 'topics.id', 'bookings.topic_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('topics.name')
            .orderBy(knexBooking.raw('count(bookings.id)'), 'desc')
            .first();
    }

    // Grafik & Peringkat
    getBookingTrendInRange(startDate, endDate) {
        return Booking.query()
            .select(knexBooking.raw('DATE(start_time) as date'), knexBooking.raw('count(id) as count'))
            .whereBetween('start_time', [startDate, endDate])
            .groupByRaw('DATE(start_time)')
            .orderBy('date', 'asc');
    }

    getRoomUtilizationInRange(startDate, endDate) {
        return Room.query()
            .select('rooms.name', knexBooking.raw('count(bookings.id) as booking_count'))
            .join('bookings', 'rooms.id', 'bookings.room_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('rooms.name')
            .orderBy('booking_count', 'desc')
            .limit(5);
    }

    getStatusDistributionInRange(startDate, endDate) {
        return Booking.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .whereBetween('start_time', [startDate, endDate])
            .groupBy('status');
    }

    getTopTopicsInRange(startDate, endDate) {
        return Topic.query()
            .select('topics.name', knexBooking.raw('count(bookings.id) as booking_count'))
            .join('bookings', 'topics.id', 'bookings.topic_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('topics.name')
            .orderBy('booking_count', 'desc')
            .limit(5);
    }

    getTopAmenitiesInRange(startDate, endDate) {
        return OrderAmenity.query()
            .select('amenities.name', knexBooking.raw('count(order_aminities.id) as request_count'))
            .join('amenities', 'order_aminities.amenity_id', 'amenities.id')
            .join('bookings', 'order_aminities.booking_id', 'bookings.id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('amenities.name')
            .orderBy('request_count', 'desc')
            .limit(5);
    }

    getTotalOrdersInRange(startDate, endDate) {
        return Order.query().whereBetween('order_date', [startDate, endDate]).resultSize();
    }

    getPendingOrdersCount() {
        return Order.query().where('status', 'Submit').resultSize();
    }

    getTopRequesterIdInRange(startDate, endDate) {
        return Order.query()
            .select('user_id')
            .count('id as order_count')
            .whereBetween('order_date', [startDate, endDate])
            .groupBy('user_id')
            .orderBy('order_count', 'desc')
            .first();
    }

    getOrderTrendInRange(startDate, endDate) {
        return Order.query()
            .select(knexBooking.raw('DATE(order_date) as date'), knexBooking.raw('count(id) as count'))
            .whereBetween('order_date', [startDate, endDate])
            .groupByRaw('DATE(order_date)')
            .orderBy('date', 'asc');
    }

    getOrderStatusDistributionInRange(startDate, endDate) {
        return Order.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .whereBetween('order_date', [startDate, endDate])
            .groupBy('status');
    }


    // --- Method yang Diubah / Ditulis Ulang ---
    // Method lama 'getMostPopularConsumptionTypeInRange' dan 'getTopConsumptionTypesInRange'
    // digantikan oleh satu method yang lebih akurat dan fleksibel ini.
    // Di controller, Anda bisa ambil elemen pertama dari hasilnya untuk "Most Popular".

    /**
     * Mengambil jenis konsumsi teratas berdasarkan jumlah total item (qty) yang dipesan.
     * @param {string} startDate 
     * @param {string} endDate 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    getTopConsumptionTypesByQtyInRange(startDate, endDate, limit = 5) {
        // Query ini sekarang join melalui order_details dan menjumlahkan qty
        return ConsumptionType.query()
            .select('consumption_types.name')
            // Join ke order_details (od)
            .join('order_details as od', 'consumption_types.id', 'od.consumption_type_id')
            // Join ke orders (o) untuk filter tanggal
            .join('orders as o', 'od.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .groupBy('consumption_types.name')
            // Menggunakan SUM(qty) untuk akurasi, bukan COUNT
            .sum('od.qty as total_quantity')
            .orderBy('total_quantity', 'desc')
            .limit(limit);
    }


    // --- Method Baru (Sesuai Saran) ---
    // Menambahkan metrik baru untuk wawasan yang lebih dalam.

    /**
     * Menghitung total semua item (qty) yang dipesan dalam rentang waktu.
     * @param {string} startDate 
     * @param {string} endDate 
     * @returns {Promise<number>}
     */
    async getTotalItemsOrderedInRange(startDate, endDate) {
        const result = await OrderDetail.query()
            .join('orders as o', 'order_details.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .sum('qty as total_items')
            .first();

        // Mengembalikan 0 jika tidak ada hasil
        return result ? Number(result.total_items) : 0;
    }

    /**
     * Menemukan item menu spesifik yang paling populer berdasarkan total qty.
     * @param {string} startDate 
     * @param {string} endDate 
     * @returns {Promise<Object|null>}
     */
    getMostPopularMenuItemInRange(startDate, endDate) {
        return OrderDetail.query()
            .select('menu')
            .join('orders as o', 'order_details.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .whereNotNull('menu') // Hindari menu yang kosong
            .groupBy('menu')
            .sum('qty as total_qty')
            .orderBy('total_qty', 'desc')
            .first();
    }
}

module.exports = new DashboardRepository();