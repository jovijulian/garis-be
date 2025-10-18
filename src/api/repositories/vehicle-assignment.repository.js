const BaseRepository = require('./base.repository');
const VehicleAssignment = require('../models/VehicleAssignment');

class VehicleAssignmentRepository extends BaseRepository {
    constructor() {
        super(VehicleAssignment);
    }

    async deleteByRequestId(requestId) {
        return await VehicleAssignment.query().delete().where('request_id', requestId);
    }
}

module.exports = new VehicleAssignmentRepository();