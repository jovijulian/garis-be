const BaseRepository = require('./base.repository');
const AccommodationGuest = require('../models/AccommodationGuest');

class AccommodationGuestRepository extends BaseRepository {
    constructor() {
        super(AccommodationGuest);
    }

    async deleteByOrderId(orderId) {
        return await AccommodationGuest.query().delete().where('accommodation_order_id', orderId);
    }
}

module.exports = new AccommodationGuestRepository();