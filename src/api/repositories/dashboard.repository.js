const { knexBooking } = require('../../config/database');

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Topic = require('../models/Topic');
const OrderAmenity = require('../models/OrderAmenity');
const Order = require('../models/Order');
const ConsumptionType = require('../models/ConsumptionType');
const User = require('../models/User');


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
        return Order.query().whereBetween('order_time', [startDate, endDate]).resultSize();
    }

    getPendingOrdersCount() {
        return Order.query().where('status', 'Submit').resultSize();
    }

    getMostPopularConsumptionTypeInRange(startDate, endDate) {
        return ConsumptionType.query()
            .select('consumption_types.name')
            .join('orders', 'consumption_types.id', 'orders.consumption_type_id')
            .whereBetween('orders.order_time', [startDate, endDate])
            .groupBy('consumption_types.name')
            .orderBy(knexBooking.raw('count(orders.id)'), 'desc')
            .first();
    }

    getTopRequesterIdInRange(startDate, endDate) {
        return Order.query()
            .select('user_id')
            .count('id as order_count')
            .whereBetween('order_time', [startDate, endDate])
            .groupBy('user_id')
            .orderBy('order_count', 'desc')
            .first();
    }

    // --- Chart & Ranking Queries ---
    getOrderTrendInRange(startDate, endDate) {
        return Order.query()
            .select(knexBooking.raw('DATE(order_time) as date'), knexBooking.raw('count(id) as count'))
            .whereBetween('order_time', [startDate, endDate])
            .groupByRaw('DATE(order_time)')
            .orderBy('date', 'asc');
    }

    getOrderStatusDistributionInRange(startDate, endDate) {
        return Order.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .whereBetween('order_time', [startDate, endDate])
            .groupBy('status');
    }

    getTopConsumptionTypesInRange(startDate, endDate) {
        return ConsumptionType.query()
            .select('consumption_types.name', knexBooking.raw('count(orders.id) as order_count'))
            .join('orders', 'consumption_types.id', 'orders.consumption_type_id')
            .whereBetween('orders.order_time', [startDate, endDate])
            .groupBy('consumption_types.name')
            .orderBy('order_count', 'desc')
            .limit(5);
    }
}

module.exports = new DashboardRepository();