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
            mostPopularConsumptionType,
            orderTrend,
            statusDistribution,
            topConsumptionTypes,
        ] = await Promise.all([
            dashboardRepository.getTotalOrdersInRange(startDate, endDate),
            dashboardRepository.getPendingOrdersCount(),
            dashboardRepository.getMostPopularConsumptionTypeInRange(startDate, endDate),
            dashboardRepository.getOrderTrendInRange(startDate, endDate),
            dashboardRepository.getOrderStatusDistributionInRange(startDate, endDate),
            dashboardRepository.getTopConsumptionTypesInRange(startDate, endDate),
        ]);

        let topRequesterName = 'N/A';
        const topRequesterResult = await dashboardRepository.getTopRequesterIdInRange(startDate, endDate);
        if (topRequesterResult && topRequesterResult.user_id) {
            const topUser = await userRepository.findById(topRequesterResult.user_id);
            if (topUser) {
                topRequesterName = topUser.nama_user;
            }
        }

        return {
            kpi: {
                total_orders_in_range: totalOrders,
                pending_orders_count: pendingOrdersCount,
                most_popular_consumption_type: mostPopularConsumptionType ? mostPopularConsumptionType.name : 'N/A',
                top_requester: topRequesterName,
            },
            charts: {
                order_trend: orderTrend,
            },
            rankings: {
                status_distribution: statusDistribution,
                top_consumption_types: topConsumptionTypes,
            }
        };
    }
}

module.exports = new DashboardService();