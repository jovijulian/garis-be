const dashboardRepository = require('../repositories/dashboard.repository');
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
}

module.exports = new DashboardService();