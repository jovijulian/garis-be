const BaseRepository = require('./base.repository');
const RequestAssignedDriver = require('../models/RequestAssignedDriver');

class RequestAssignedDriverRepository extends BaseRepository {
    constructor() {
        super(RequestAssignedDriver);
    }

    async deleteByRequestId(request_id) {
        return await RequestAssignedDriver.query().delete().where('request_id', request_id);
    }
}

module.exports = new RequestAssignedDriverRepository();