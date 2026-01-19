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
const AccommodationOrder = require('../models/AccommodationOrder');
const TransportOrder = require('../models/TransportOrder');
const _ = require('lodash');
const moment = require('moment');


class DashboardRepository {

    //pending
    getPendingBookingCount(status, siteId) {
        return Booking.query().modify(q => {
            if (siteId) {
                q.whereExists(
                    Booking.relatedQuery('room').where('cab_id', siteId)
                );
            }
        }).where('status', status).where('is_active', 1).resultSize();
        // return Booking.query().where('status', status).where('cab_id', siteId).resultSize();
    }
    getPendingVehiclesCount(status, siteId) {
        return VehicleRequest.query().where('status', status).where('is_active', 1).where('cab_id', siteId).resultSize();
    }
    async getPendingOrderCount(status, siteId) {
        const countAccommodation = await AccommodationOrder.query().where('status', status).where('is_active', 1).where('cab_id', siteId).resultSize();
        const countTransport = await TransportOrder.query().where('status', status).where('is_active', 1).where('cab_id', siteId).resultSize();
        const orderCount = await Order.query().where('status', status).where('is_active', 1).where('cab_id', siteId).resultSize();
        return Promise.all([countAccommodation, countTransport, orderCount]).then(results => {
            return results.reduce((total, count) => total + count, 0);
        });
    }

    // booking
    getTotalBookingsInRange(startDate, endDate, siteId) {
        return Booking.query().modify(q => {
            if (siteId) {
                q.whereExists(
                    Booking.relatedQuery('room').where('cab_id', siteId)
                );
            }
        }).whereBetween('start_time', [startDate, endDate]).where('is_active', 1).resultSize();
    }

    getPendingBookingsCount(siteId) {
        return Booking.query().modify(q => {
            if (siteId) {
                q.whereExists(
                    Booking.relatedQuery('room').where('cab_id', siteId)
                );
            }
        }).where('status', 'Submit').where('is_active', 1).resultSize();
    }

    async getMostPopularRoomInRange(startDate, endDate) {
        return Room.query()
            .select('rooms.name')
            .where('rooms.is_active', 1)
            .join('bookings', 'rooms.id', 'bookings.room_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('rooms.name')
            .orderBy(knexBooking.raw('count(bookings.id)'), 'desc')
            .first();
    }

    async getMostPopularTopicInRange(startDate, endDate) {
        return Topic.query()
            .select('topics.name')
            .where('topics.is_active', 1)
            .join('bookings', 'topics.id', 'bookings.topic_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('topics.name')
            .orderBy(knexBooking.raw('count(bookings.id)'), 'desc')
            .first();
    }

    // Grafik & Peringkat
    getBookingTrendInRange(startDate, endDate, siteId) {
        return Booking.query()
            .select(knexBooking.raw('DATE(start_time) as date'), knexBooking.raw('count(id) as count'))
            .modify(q => {
                if (siteId) {
                    q.whereExists(
                        Booking.relatedQuery('room').where('cab_id', siteId)
                    );
                }
            })
            .whereBetween('start_time', [startDate, endDate])
            .where('is_active', 1)
            .groupByRaw('DATE(start_time)')
            .orderBy('date', 'asc');
    }

    getRoomUtilizationInRange(startDate, endDate) {
        return Room.query()
            .select('rooms.name', knexBooking.raw('count(bookings.id) as booking_count'))
            .where('rooms.is_active', 1)
            .join('bookings', 'rooms.id', 'bookings.room_id')
            .whereBetween('bookings.start_time', [startDate, endDate])
            .groupBy('rooms.name')
            .orderBy('booking_count', 'desc')
            .limit(5);
    }

    getStatusDistributionInRange(startDate, endDate, siteId) {
        return Booking.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .where('is_active', 1)
            .modify(q => {
                if (siteId) {
                    q.whereExists(
                        Booking.relatedQuery('room').where('cab_id', siteId)
                    );
                }
            })
            .whereBetween('start_time', [startDate, endDate])
            .groupBy('status');
    }

    getTopTopicsInRange(startDate, endDate) {
        return Topic.query()
            .select('topics.name', knexBooking.raw('count(bookings.id) as booking_count'))
            .where('topics.is_active', 1)
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
    async getTotalOrdersInRange(startDate, endDate, siteId) {
        const [food, accommodation, transport] = await Promise.all([
            Order.query().whereBetween('order_date', [startDate, endDate]).where('is_active', 1).where('cab_id', siteId).resultSize(),
            AccommodationOrder.query().whereBetween('check_in_date', [startDate, endDate]).where('is_active', 1).where('cab_id', siteId).resultSize(),
            TransportOrder.query().whereBetween('date', [startDate, endDate]).where('is_active', 1).where('cab_id', siteId).resultSize()
        ]);
        return food + accommodation + transport;
    }

    async getPendingOrdersCount(siteId) {
        const [food, accommodation, transport] = await Promise.all([
            Order.query().where('status', 'Submit').where('is_active', 1).where('cab_id', siteId).resultSize(),
            AccommodationOrder.query().where('status', 'Submit').where('is_active', 1).where('cab_id', siteId).resultSize(),
            TransportOrder.query().where('status', 'Submit').where('is_active', 1).where('cab_id', siteId).resultSize()
        ]);
        return food + accommodation + transport;
    }

    // getPendingOrdersCount(siteId) {
    //     return Order.query().where('status', 'Submit').where('is_active', 1).where('cab_id', siteId).resultSize();
    // }

    async getTopRequesterIdInRange(startDate, endDate, siteId) {
        const fetchUserCounts = (Model, dateCol) => {
            return Model.query()
                .select('user_id')
                .count('id as order_count')
                .whereBetween(dateCol, [startDate, endDate])
                .where('cab_id', siteId)
                .where('is_active', 1)
                .groupBy('user_id');
        };

        const [foodCounts, hotelCounts, transportCounts] = await Promise.all([
            fetchUserCounts(Order, 'order_date'),
            fetchUserCounts(AccommodationOrder, 'check_in_date'),
            fetchUserCounts(TransportOrder, 'date')
        ]);

        const allCounts = [...foodCounts, ...hotelCounts, ...transportCounts];
        const userTotals = {};
        allCounts.forEach(item => {
            const userId = item.user_id;
            const count = Number(item.order_count) || 0;

            if (userTotals[userId]) {
                userTotals[userId] += count;
            } else {
                userTotals[userId] = count;
            }
        });

        let topUser = null;
        let maxCount = -1;

        for (const [userId, total] of Object.entries(userTotals)) {
            if (total > maxCount) {
                maxCount = total;
                topUser = userId;
            }
        }

        if (topUser) {
            return { user_id: topUser, order_count: maxCount };
        }
        return null;
    }

    async getOrderTrendInRange(startDate, endDate, siteId) {
        const fetchTrend = (Model, dateCol) => {
            return Model.query()
                .select(knexBooking.raw(`DATE(${dateCol}) as date`), knexBooking.raw('count(id) as count'))
                .whereBetween(dateCol, [startDate, endDate])
                .where('cab_id', siteId)
                .where('is_active', 1)
                .groupByRaw(`DATE(${dateCol})`);
        };

        const [foodTrend, hotelTrend, transportTrend] = await Promise.all([
            fetchTrend(Order, 'order_date'),
            fetchTrend(AccommodationOrder, 'check_in_date'),
            fetchTrend(TransportOrder, 'date')
        ]);

        const combined = [...foodTrend, ...hotelTrend, ...transportTrend];

        const mergedTrend = _(combined)
            .groupBy(item => moment(item.date).format('YYYY-MM-DD'))
            .map((items, date) => ({
                date: date,
                count: _.sumBy(items, item => Number(item.count))
            }))
            .sortBy('date')
            .value();

        return mergedTrend;
    }

    async getOrderStatusDistributionInRange(startDate, endDate, siteId) {
        const fetchStatus = (Model, dateCol) => {
            return Model.query()
                .select('status', knexBooking.raw('count(id) as count'))
                .where('cab_id', siteId)
                .where('is_active', 1)
                .whereBetween(dateCol, [startDate, endDate])
                .groupBy('status');
        };

        const [foodStatus, hotelStatus, transportStatus] = await Promise.all([
            fetchStatus(Order, 'order_date'),
            fetchStatus(AccommodationOrder, 'check_in_date'),
            fetchStatus(TransportOrder, 'date')
        ]);

        const combined = [...foodStatus, ...hotelStatus, ...transportStatus];

        const mergedStatus = _(combined)
            .groupBy('status')
            .map((items, status) => ({
                status: status,
                count: _.sumBy(items, item => Number(item.count))
            }))
            .value();

        return mergedStatus;
    }

    async topServiceOrder(startDate, endDate, siteId) {
        const [countFood, countHotel, countTransport] = await Promise.all([
            Order.query().whereBetween('order_date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize(),
            AccommodationOrder.query().whereBetween('check_in_date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize(),
            TransportOrder.query().whereBetween('date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize()
        ]);

        const serviceComposition = [
            { name: 'Konsumsi', total_quantity: countFood },
            { name: 'Akomodasi / Hotel', total_quantity: countHotel },
            { name: 'Transportasi', total_quantity: countTransport }
        ].sort((a, b) => b.total_quantity - a.total_quantity);

        const mostPopularService = serviceComposition[0].total_quantity > 0 ? serviceComposition[0].name : '-';
        return {
            most_popular_service: mostPopularService,
            service_composition: serviceComposition
        }
    }

    getTopConsumptionTypesByQtyInRange(startDate, endDate, limit = 5) {
        return ConsumptionType.query()
            .select('consumption_types.name')
            .where('consumption_types.is_active', 1)
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
            .where('o.is_active', 1)
            .whereBetween('o.order_date', [startDate, endDate])
            .sum('qty as total_items')
            .first();

        return result ? Number(result.total_items) : 0;
    }

    getMostPopularMenuItemInRange(startDate, endDate) {
        return OrderDetail.query()
            .select('menu')
            .join('orders as o', 'order_details.order_id', 'o.id')
            .where('o.is_active', 1)
            .whereBetween('o.order_date', [startDate, endDate])
            .whereNotNull('menu')
            .groupBy('menu')
            .sum('qty as total_qty')
            .orderBy('total_qty', 'desc')
    }

    //vehicle request
    getTotalRequestsInRange(startDate, endDate, siteId) {
        return VehicleRequest.query().whereBetween('start_time', [startDate, endDate]).where('is_active', 1).where('cab_id', siteId).resultSize();
    }

    getPendingRequestsCount(siteId) {
        return VehicleRequest.query().where('status', 'Submit').where('cab_id', siteId).where('is_active', 1).where('is_active', 1).resultSize();
    }

    getRequestTrendInRange(startDate, endDate, siteId) {
        return VehicleRequest.query()
            .select(knexBooking.raw('DATE(start_time) as date'), knexBooking.raw('count(id) as count'))
            .where('cab_id', siteId)
            .where('is_active', 1)
            .whereBetween('start_time', [startDate, endDate])
            .groupByRaw('DATE(start_time)')
            .orderBy('start_time', 'asc');
    }

    getRequestStatusDistributionInRange(startDate, endDate, siteId) {
        return VehicleRequest.query()
            .select('status', knexBooking.raw('count(id) as count'))
            .where('cab_id', siteId)
            .where('is_active', 1)
            .whereBetween('start_time', [startDate, endDate])
            .groupBy('status');
    }

    getTopVehicleRequesterIdInRange(startDate, endDate, siteId) {
        return VehicleRequest.query()
            .select('id_user')
            .count('id as request_count')
            .where('cab_id', siteId)
            .where('is_active', 1)
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
            .where('is_active', 1)
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