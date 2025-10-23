const { knexBooking } = require('../../config/database');

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Topic = require('../models/Topic');
const OrderAmenity = require('../models/OrderAmenity');
const Order = require('../models/Order');
const ConsumptionType = require('../models/ConsumptionType');
const User = require('../models/User');
const OrderDetail = require('../models/OrderDetail');
const VehicleRequest = require('../models/VehicleRequest');
const VehicleAssignment = require('../models/VehicleAssignment');
const Site = require('../models/Site');
const Vehicle = require('../models/Vehicle')
const Driver = require('../models/Driver')


class DashboardRepository {
    // booking
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

    // order 
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

    getTopConsumptionTypesByQtyInRange(startDate, endDate, limit = 5) {
        return ConsumptionType.query()
            .select('consumption_types.name')
            .join('order_details as od', 'consumption_types.id', 'od.consumption_type_id')
            .join('orders as o', 'od.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .groupBy('consumption_types.name')
            .sum('od.qty as total_quantity')
            .orderBy('total_quantity', 'desc')
            .limit(limit);
    }

    async getTotalItemsOrderedInRange(startDate, endDate) {
        const result = await OrderDetail.query()
            .join('orders as o', 'order_details.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .sum('qty as total_items')
            .first();

        return result ? Number(result.total_items) : 0;
    }

    getMostPopularMenuItemInRange(startDate, endDate) {
        return OrderDetail.query()
            .select('menu')
            .join('orders as o', 'order_details.order_id', 'o.id')
            .whereBetween('o.order_date', [startDate, endDate])
            .whereNotNull('menu')
            .groupBy('menu')
            .sum('qty as total_qty')
            .orderBy('total_qty', 'desc')
    }

    //vehicle request
    getTotalRequestsInRange(startDate, endDate) {
        return VehicleRequest.query().whereBetween('start_time', [startDate, endDate]).resultSize();
    }

    getPendingRequestsCount() {
        return VehicleRequest.query().where('status', 'Submit').resultSize();
    }

    getRequestTrendInRange(startDate, endDate) {
        return VehicleRequest.query()
            .select(knexBooking.raw('DATE(start_time) as date'), knexBooking.raw('count(id) as count'))
            .whereBetween('start_time', [startDate, endDate])
            .groupByRaw('DATE(start_time)')
            .orderBy('start_time', 'asc');
    }

    getRequestStatusDistributionInRange(startDate, endDate) {
        return VehicleRequest.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .whereBetween('start_time', [startDate, endDate])
            .groupBy('status');
    }

    getTopVehicleRequesterIdInRange(startDate, endDate) {
        return VehicleRequest.query()
            .select('id_user')
            .count('id as request_count')
            .whereBetween('start_time', [startDate, endDate])
            .groupBy('id_user')
            .orderBy('request_count', 'desc')
            .first();
    }

    async getTopVehicleTypesRequestedInRange(startDate, endDate, limit = 5) {
        return VehicleRequest.query()
            .select('vt.name', knexBooking.raw('count(vehicle_requests.id) as request_count'))
            .join('vehicle_types as vt', 'vehicle_requests.requested_vehicle_type_id', 'vt.id')
            .whereBetween('vehicle_requests.start_time', [startDate, endDate])
            .whereNotNull('vehicle_requests.requested_vehicle_type_id')
            .groupBy('vt.name')
            .orderBy('request_count', 'desc')
            .limit(limit);
    }


    async getTopVehiclesUsedInRange(startDate, endDate, limit = 5) {
        return VehicleAssignment.query()
            .select('v.name', 'v.license_plate', knexBooking.raw('count(vehicle_assignments.id) as assignment_count'))
            .join('vehicles as v', 'vehicle_assignments.vehicle_id', 'v.id')
            .join('vehicle_requests as vr', 'vehicle_assignments.request_id', 'vr.id')
            .whereBetween('vr.start_time', [startDate, endDate])
            .groupBy('v.name', 'v.license_plate')
            .orderBy('assignment_count', 'desc')
            .limit(limit);
    }

    async getTopDriversAssignedInRange(startDate, endDate, limit = 5) {
        return VehicleAssignment.query()
            .select('d.name', knexBooking.raw('count(vehicle_assignments.id) as assignment_count'))
            .join('drivers as d', 'vehicle_assignments.driver_id', 'd.id')
            .join('vehicle_requests as vr', 'vehicle_assignments.request_id', 'vr.id')
            .whereBetween('vr.start_time', [startDate, endDate])
            .whereNotNull('vehicle_assignments.driver_id')
            .groupBy('d.name')
            .orderBy('assignment_count', 'desc')
            .limit(limit);
    }

    async getRequestCountsByBranchIdInRange(startDate, endDate) {
        return VehicleRequest.query() 
            .select('cab_id')
            .count('id as request_count')
            .whereBetween('start_time', [startDate, endDate])
            .whereNotNull('cab_id')
            .groupBy('cab_id');
    }

    async getVehicleCountsByBranchId() {
        return Vehicle.query() 
            .select('cab_id')
            .where('is_active', 1)
            .count('id as vehicle_count')
            .whereNotNull('cab_id')
            .groupBy('cab_id');
    }


    async getDriverCountsByBranchId() {
        return Driver.query() 
            .select('cab_id')
            .where('is_active', 1)
            .count('id as driver_count')
            .whereNotNull('cab_id')
            .groupBy('cab_id');
    }

   
    async getAllBranches() {
        return Site.query().select('id_cab', 'nama_cab');
    }



}

module.exports = new DashboardRepository();