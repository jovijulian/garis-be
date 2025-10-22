const dashboardRepository = require('../repositories/dashboard.repository');
const userRepository = require('../repositories/user.repository');
const moment = require('moment');
const _ = require('lodash');
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
            topConsumptionTypesByQty, 
        ] = await Promise.all([
            dashboardRepository.getTotalOrdersInRange(startDate, endDate),
            dashboardRepository.getPendingOrdersCount(),
            dashboardRepository.getOrderTrendInRange(startDate, endDate),
            dashboardRepository.getOrderStatusDistributionInRange(startDate, endDate),
            dashboardRepository.getTopRequesterIdInRange(startDate, endDate),

            dashboardRepository.getTotalItemsOrderedInRange(startDate, endDate),
            dashboardRepository.getTopConsumptionTypesByQtyInRange(startDate, endDate, 5), 
            dashboardRepository.getMostPopularMenuItemInRange(startDate, endDate),
        ]);

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

    async getVehicleRequestDashboardData(queryParams = {}) {
        const startDate = queryParams.startDate ?
            moment(queryParams.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');

        const endDate = queryParams.endDate ?
            moment(queryParams.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') :
            moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');

        const [
            totalRequests,
            pendingRequestsCount,
            requestTrend,
            statusDistribution,
            topRequesterResult,
            topVehicleTypesRequested,
            topVehiclesUsed, 
            topDriversAssigned, 
            requestCountsById,  
            vehicleCountsById,  
            driverCountsById,   
            allBranches
        ] = await Promise.all([
            dashboardRepository.getTotalRequestsInRange(startDate, endDate),
            dashboardRepository.getPendingRequestsCount(), 
            dashboardRepository.getRequestTrendInRange(startDate, endDate),
            dashboardRepository.getRequestStatusDistributionInRange(startDate, endDate),
            dashboardRepository.getTopRequesterIdInRange(startDate, endDate),
            dashboardRepository.getTopVehicleTypesRequestedInRange(startDate, endDate, 5),
            dashboardRepository.getTopVehiclesUsedInRange(startDate, endDate, 5),
            dashboardRepository.getTopDriversAssignedInRange(startDate, endDate, 5),
            dashboardRepository.getRequestCountsByBranchIdInRange(startDate, endDate),
            dashboardRepository.getVehicleCountsByBranchId(),
            dashboardRepository.getDriverCountsByBranchId(),
            dashboardRepository.getAllBranches() 
        ]);

        let topRequesterName = 'N/A';
        if (topRequesterResult && topRequesterResult.user_id) {
            const topUser = await userRepository.findById(topRequesterResult.user_id); 
            if (topUser) {
                topRequesterName = topUser.nama_user;
            }
        }
        const branchMap = _.keyBy(allBranches, 'id_cab');

        const requestCountByBranch = requestCountsById.map(item => ({
            nama_cab: branchMap[item.cab_id]?.nama_cab || `Unknown Branch (ID: ${item.cab_id})`,
            request_count: Number(item.request_count) || 0 
        })).sort((a, b) => b.request_count - a.request_count); 

        const vehicleCountByBranch = vehicleCountsById.map(item => ({
            nama_cab: branchMap[item.cab_id]?.nama_cab || `Unknown Branch (ID: ${item.cab_id})`,
            vehicle_count: Number(item.vehicle_count) || 0
        })).sort((a, b) => b.vehicle_count - a.vehicle_count);

        const driverCountByBranch = driverCountsById.map(item => ({
            nama_cab: branchMap[item.cab_id]?.nama_cab || `Unknown Branch (ID: ${item.cab_id})`,
            driver_count: Number(item.driver_count) || 0
        })).sort((a, b) => b.driver_count - a.driver_count);

        const mostRequestedVehicleType = topVehicleTypesRequested.length > 0 ? topVehicleTypesRequested[0].name : 'N/A';

        return {
            kpi: {
                total_requests_in_range: totalRequests,
                pending_requests_count: pendingRequestsCount,
                most_requested_vehicle_type: mostRequestedVehicleType,
                top_requester: topRequesterName,
            },
            charts: {
                request_trend: requestTrend,
                status_distribution: statusDistribution,
                request_count_by_branch: requestCountByBranch,
                vehicle_count_by_branch: vehicleCountByBranch,
                driver_count_by_branch: driverCountByBranch,
            },
            rankings: {
                top_vehicle_types_requested: topVehicleTypesRequested,
                top_vehicles_used: topVehiclesUsed,
                top_drivers_assigned: topDriversAssigned,
            }
        };
    }
}

module.exports = new DashboardService();