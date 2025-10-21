const BaseRepository = require('./base.repository');
const VehicleAssignment = require('../models/VehicleAssignment');

class VehicleAssignmentRepository extends BaseRepository {
    constructor() {
        super(VehicleAssignment);
    }

    async deleteByRequestId(requestId) {
        return await VehicleAssignment.query().delete().where('request_id', requestId);
    }

    async findAllAssignmentsByDriverUserId(driverUserId) {
        return await VehicleAssignment.query()
            .where('driver_user_id', driverUserId)
            .orderBy('assigned_at', 'desc');
    }

    async findAllAssignmentsByDriverUserId(queryParams = {}, driverUserId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;

        const query = VehicleAssignment.query()
            .where('driver_id', driverUserId)
            .withGraphFetched('[vehicle_request.[user, vehicle_type, cabang], vehicle]')
            .joinRelated('vehicle_request')
            .orderBy('vehicle_request.start_time', 'desc')
            .page(page - 1, per_page)

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }
}

module.exports = new VehicleAssignmentRepository();