const BaseRepository = require('./base.repository');
const TransportPassenger = require('../models/TransportPassenger');

class TransportPassengerRepository extends BaseRepository {
    constructor() {
        super(TransportPassenger);
    }

    async deleteByOrderId(orderId) {
        return await TransportPassenger.query().delete().where('transport_order_id', orderId);
    }
}

module.exports = new TransportPassengerRepository();