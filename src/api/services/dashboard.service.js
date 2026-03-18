const dashboardRepository = require('../repositories/dashboard.repository');
const userRepository = require('../repositories/user.repository');
const moment = require('moment');
const _ = require('lodash');
const { getCabId, formatDateTime } = require("../helpers/dataHelpers");
class DashboardService {
    async getDashboardData(queryParams = {}, request) {
        const siteId = request.user.sites
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
            dashboardRepository.getTotalBookingsInRange(startDate, endDate, siteId),
            dashboardRepository.getPendingBookingsCount(siteId),
            dashboardRepository.getMostPopularRoomInRange(startDate, endDate),
            dashboardRepository.getMostPopularTopicInRange(startDate, endDate),
            dashboardRepository.getBookingTrendInRange(startDate, endDate, siteId),
            dashboardRepository.getRoomUtilizationInRange(startDate, endDate),
            dashboardRepository.getStatusDistributionInRange(startDate, endDate, siteId),
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

    async getOrderDashboardData(queryParams = {}, request) {
        const siteId = request.user.sites

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
            topServiceOrder
        ] = await Promise.all([
            dashboardRepository.getTotalOrdersInRange(startDate, endDate, siteId),
            dashboardRepository.getPendingOrdersCount(siteId),
            dashboardRepository.getOrderTrendInRange(startDate, endDate, siteId),
            dashboardRepository.getOrderStatusDistributionInRange(startDate, endDate, siteId),
            dashboardRepository.topServiceOrder(startDate, endDate, siteId),
        ]);

        // const [countFood, countHotel, countTransport] = await Promise.all([
        //     Order.query().whereBetween('order_date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize(),
        //     AccommodationOrder.query().whereBetween('check_in_date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize(),
        //     TransportOrder.query().whereBetween('date', [startDate, endDate]).where('cab_id', siteId).where('is_active', 1).resultSize()
        // ]);

        // const serviceComposition = [
        //     { name: 'Food & Bev', total_quantity: countFood },
        //     { name: 'Accommodation', total_quantity: countHotel },
        //     { name: 'Transport', total_quantity: countTransport }
        // ].sort((a, b) => b.total_quantity - a.total_quantity);

        // const mostPopularService = serviceComposition[0].total_quantity > 0 ? serviceComposition[0].name : '-';
        const topRequesterResult = await dashboardRepository.getTopRequesterIdInRange(startDate, endDate, siteId);
        let topRequesterName = 'N/A';
        if (topRequesterResult && topRequesterResult.user_id) {
            const topUser = await userRepository.findById(topRequesterResult.user_id);
            if (topUser) topRequesterName = topUser.nama_user;
        }

        // return {
        //     kpi: {
        //         total_orders_in_range: totalOrders,
        //         pending_orders_count: pendingOrdersCount,
        //         most_popular_consumption_type: mostPopularConsumptionType,
        //         top_requester: topRequesterName,
        //     },
        //     charts: {
        //         order_trend: orderTrend,

        //     },
        //     rankings: {
        //         top_consumption_types: topConsumptionTypesByQty,
        //         status_distribution: statusDistribution,
        //     }
        // };
        return {
            kpi: {
                total_orders_in_range: totalOrders,
                pending_orders_count: pendingOrdersCount,
                most_popular_consumption_type: topServiceOrder.most_popular_service,
                top_requester: topRequesterName,
            },
            charts: {
                order_trend: orderTrend,
            },
            rankings: {
                top_consumption_types: topServiceOrder.service_composition,
                status_distribution: statusDistribution,
            }
        };
    }

    async getVehicleRequestDashboardData(queryParams = {}, request) {
        const siteId = request.user.sites
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
            dashboardRepository.getTotalRequestsInRange(startDate, endDate, siteId),
            dashboardRepository.getPendingRequestsCount(siteId),
            dashboardRepository.getRequestTrendInRange(startDate, endDate, siteId),
            dashboardRepository.getRequestStatusDistributionInRange(startDate, endDate, siteId),
            dashboardRepository.getTopRequesterIdInRange(startDate, endDate, siteId),
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

    async getPendingRequestsCount(request) {
        const siteId = request.user.sites
        const status = 'Submit'
        const [
            pendingBooking,
            pendingVehicles,
            pendingOrders,
        ] = await Promise.all([
            dashboardRepository.getPendingBookingCount(status, siteId),
            dashboardRepository.getPendingVehiclesCount(status, siteId),
            dashboardRepository.getPendingOrderCount(status, siteId),
        ]);
        return {
            pending_bookings: pendingBooking,
            pending_vehicle_requests: pendingVehicles,
            pending_orders: pendingOrders,
        }
    }

    async getDashboardAlerts(request) {
        try {
            const cabId = getCabId(request);
            const currentWibTime = formatDateTime();
            const currentDateOnly = currentWibTime.substring(0, 10);
            const today = moment(currentDateOnly).startOf('day');
            console.log(cabId)
            const activeReminders = await dashboardRepository.getActiveUpcomingReminders(currentDateOnly, cabId);
            const alerts = [];

            for (const reminder of activeReminders) {
                if (!reminder.reminder_type || !reminder.reminder_type.notification_intervals) continue;

                let intervals = [];
                try { intervals = JSON.parse(reminder.reminder_type.notification_intervals); }
                catch (e) { continue; }

                if (intervals.length === 0) continue;

                const dueDate = moment(reminder.due_date).startOf('day');
                const daysLeft = dueDate.diff(today, 'days');
                const maxInterval = Math.max(...intervals);

                if (reminder.status === 'OVERDUE' || daysLeft <= maxInterval) {

                    let severity = 'warning';
                    let messageText = `Jatuh tempo dalam ${daysLeft} hari.`;

                    if (daysLeft === 0) {
                        severity = 'danger';
                        messageText = 'Jatuh tempo HARI INI!';
                    } else if (daysLeft < 0) {
                        severity = 'danger';
                        messageText = `TERLEWAT ${Math.abs(daysLeft)} HARI! Segera tindak lanjuti!`;
                    }

                    alerts.push({
                        id: reminder.id,
                        title: reminder.title,
                        module_name: reminder.reminder_type.name,
                        cabang: reminder.cabang ? reminder.cabang.nama_cab : '-',
                        due_date: reminder.due_date,
                        status: reminder.status,
                        days_left: daysLeft,
                        severity: severity,
                        message: messageText
                    });
                }
            }

            return alerts;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DashboardService();