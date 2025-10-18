const BaseRepository = require('./base.repository');
const RequestAssignedVehicle = require('../models/RequestAssignedVehicle');

class RequestAssignedVehicleRepository extends BaseRepository {
    constructor() {
        super(RequestAssignedVehicle);
    }

    async deleteByRequestId(request_id) {
        return await RequestAssignedVehicle.query().delete().where('request_id', request_id);
    }
}

module.exports = new RequestAssignedVehicleRepository();