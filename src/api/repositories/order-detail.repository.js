const BaseRepository = require('./base.repository');
const OrderDetail = require('../models/OrderDetail');

class OrderDetailRepository extends BaseRepository {
    constructor() {
        super(OrderDetail);
    }

    async deleteByOrderId(orderId) {
        return await OrderDetail.query().delete().where('order_id', orderId);
    }
}

module.exports = new OrderDetailRepository();