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

    async findByRequestId(requestId) {
        return await VehicleAssignment.query().where('request_id', requestId);
    }

    async checkConflict (requestId, start_time, end_time, vehicle_id, driver_id, trx) {
        const conflictCheckQuery = VehicleAssignment.query(trx)
        .joinRelated('vehicle_request')
        .where('vehicle_assignments.request_id', '!=', requestId) // Jangan cek bentrok dgn diri sendiri
        .whereIn('vehicle_request.status', ['Approved', 'In Progress']) // Hanya cek vs request aktif
        .andWhere(timeBuilder => {
            // Logika overlap waktu
            timeBuilder.where('vehicle_request.start_time', '<', end_time)
                       .andWhere('vehicle_request.end_time', '>', start_time);
        })
        .andWhere(assetBuilder => {
            // Cek bentrok di vehicle ATAU driver
            assetBuilder.where('vehicle_assignments.vehicle_id', vehicle_id);
            if (driver_id) {
                assetBuilder.orWhere('vehicle_assignments.driver_id', driver_id);
            }
        });
        conflictCheckQuery.first();

    }
}

module.exports = new VehicleAssignmentRepository();