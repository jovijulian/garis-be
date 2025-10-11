const dashboardRepository = require('../repositories/dashboard.repository');
const userRepository = require('../repositories/user.repository');
const moment = require('moment');
class DashboardService {
    async getDashboardData(queryParams = {}) {
        const startDate = queryParams.startDate ?
            moment(queryParams.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const endDate = queryParams.endDate ?
            moment(queryParams.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        const [
            totalBookings,
            pendingBookingsCount,
            mostPopularRoom,
            mostPopularTopic,
            bookingTrend,
            roomUtilization,
            statusDistribution,
            topTopics,
            topAmenities
        ] = await Promise.all([
            dashboardRepository.getTotalBookingsInRange(startDate, endDate),
            dashboardRepository.getPendingBookingsCount(),
            dashboardRepository.getMostPopularRoomInRange(startDate, endDate),
            dashboardRepository.getMostPopularTopicInRange(startDate, endDate),
            dashboardRepository.getBookingTrendInRange(startDate, endDate),
            dashboardRepository.getRoomUtilizationInRange(startDate, endDate),
            dashboardRepository.getStatusDistributionInRange(startDate, endDate),
            dashboardRepository.getTopTopicsInRange(startDate, endDate),
            dashboardRepository.getTopAmenitiesInRange(startDate, endDate)
        ]);

        return {
            kpi: {
                total_bookings_this_month: totalBookings,
                pending_bookings_count: pendingBookingsCount,
                most_popular_room: mostPopularRoom ? mostPopularRoom.name : 'N/A',
                most_popular_topic: mostPopularTopic ? mostPopularTopic.name : 'N/A',
            },
            charts: {
                booking_trend: bookingTrend,
                room_utilization: roomUtilization,
            },
            rankings: {
                status_distribution: statusDistribution,
                top_topics: topTopics,
                top_amenities: topAmenities,
            }
        };
    }

    async getOrderDashboardData(queryParams = {}) {
        const startDate = queryParams.startDate ?
            moment(queryParams.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const endDate = queryParams.endDate ?
            moment(queryParams.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');

        const [
            totalOrders,
            pendingOrdersCount,
            orderTrend,
            statusDistribution,
            topRequesterResult,

            // --- Metrik yang diubah & metrik baru ---
            totalItemsOrdered,
            topConsumptionTypesByQty, // Menggantikan topConsumptionTypes & mostPopular
            mostPopularMenuItem,      // Metrik baru yang disarankan
        ] = await Promise.all([
            // --- Metrik yang tidak berubah ---
            dashboardRepository.getTotalOrdersInRange(startDate, endDate),
            dashboardRepository.getPendingOrdersCount(),
            dashboardRepository.getOrderTrendInRange(startDate, endDate),
            dashboardRepository.getOrderStatusDistributionInRange(startDate, endDate),
            dashboardRepository.getTopRequesterIdInRange(startDate, endDate),

            // --- Panggilan repository baru ---
            dashboardRepository.getTotalItemsOrderedInRange(startDate, endDate),
            dashboardRepository.getTopConsumptionTypesByQtyInRange(startDate, endDate, 5), 
            dashboardRepository.getMostPopularMenuItemInRange(startDate, endDate),
        ]);

        // Logika topRequester tetap sama
        let topRequesterName = 'N/A';
        if (topRequesterResult && topRequesterResult.user_id) {
            const topUser = await userRepository.findById(topRequesterResult.user_id);
            if (topUser) {
                topRequesterName = topUser.nama_user;
            }
        }

        const mostPopularConsumptionType = topConsumptionTypesByQty.length > 0 ? topConsumptionTypesByQty[0].name : 'N/A';

        return {
            kpi: {
                total_orders_in_range: totalOrders,
                pending_orders_count: pendingOrdersCount,
                most_popular_consumption_type: mostPopularConsumptionType,
                top_requester: topRequesterName,
            },
            charts: {
                order_trend: orderTrend,
               
            },
            rankings: {
                top_consumption_types: topConsumptionTypesByQty,
                status_distribution: statusDistribution, 
            }
        };
    }
}

module.exports = new DashboardService();