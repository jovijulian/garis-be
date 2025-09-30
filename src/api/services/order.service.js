const orderRepository = require('../repositories/order.repository');
const { getUserId, formatDateTime } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
class OrderService {

    async getAll(queryParams) {
        return orderRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return orderRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await orderRepository.findByIdWithRelations(id, '[cabang, consumption_type, user, booking, room]');
        if (!data) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const bookingId = payload.booking_id
        const roomId = payload.room_id
        const locationText = payload.location_text
        return knexBooking.transaction(async (trx) => {
            if (bookingId) {
                const relatedBooking = await bookingRepository.findById(bookingId);
                if (!relatedBooking) {
                    const error = new Error('Booking not found.');
                    error.statusCode = 404;
                    throw error;
                }
                const relatedRoom = await roomRepository.findById(relatedBooking.room_id);
                payload.cab_id = relatedRoom.cab_id;
                payload.room_id = relatedBooking.room_id;
                payload.location_text = null;
                payload.order_time = payload.order_time || relatedBooking.start_time;
            }

            if (roomId) {
                const relatedRoom = await roomRepository.findById(roomId);
                if (!relatedRoom) {
                    const error = new Error('Room not found.');
                    error.statusCode = 404;
                    throw error;
                }
                payload.cab_id = relatedRoom.cab_id;
                payload.location_text = null;
            }

            if (locationText) {
                payload.cab_id = payload.cab_id;
                payload.room_id = null;
                payload.location_text = locationText;
            }

            payload.pax = payload.pax;
            payload.user_id = payload.user_id || userId;
            payload.status = 'Submit';
            payload.created_at = formatDateTime();
            payload.updated_at = formatDateTime();

            const data = await orderRepository.create(payload, trx);
            return data;
        });

    }

    async updateOrderUser(id, request) {
        const payload = request.body;
        const existingOrder = await this.detail(id);
        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
        const roomId = payload.room_id
        const locationText = payload.location_text
        const bookingId = payload.booking_id
        return knexBooking.transaction(async (trx) => {
            if (bookingId) {
                const relatedBooking = await bookingRepository.findById(bookingId);
                if (!relatedBooking) {
                    const error = new Error('Booking not found.');
                    error.statusCode = 404;
                    throw error;
                }
                payload.cab_id = relatedBooking.room.cab_id;
                payload.room_id = relatedBooking.room.id;
                payload.location_text = null;
                payload.order_time = payload.order_time || relatedBooking.start_time;
            }

            if (roomId) {
                const relatedRoom = await roomRepository.findById(roomId);
                if (!relatedRoom) {
                    const error = new Error('Room not found.');
                    error.statusCode = 404;
                    throw error;
                }
                payload.cab_id = relatedRoom.cab_id;
                payload.location_text = null;
            }

            if (locationText) {
                payload.cab_id = payload.cab_id;
                payload.room_id = null;
                payload.location_text = locationText;
            }

            payload.pax = payload.pax || existingOrder.pax;
            payload.consumption_type_id = payload.consumption_type_id || existingOrder.consumption_type_id;
            payload.menu_description = payload.menu_description || existingOrder.menu_description;
            payload.order_time = payload.order_time || existingOrder.order_time;
            payload.updated_at = formatDateTime();

            const data = await orderRepository.update(id, payload, trx);
            return data;
        });
    }

    async delete(id) {
        const existingOrder = await this.detail(id);
        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order cannot be deleted as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
        return knexBooking.transaction(async (trx) => {
            await orderRepository.delete(id, trx);
            return { message: 'Order has been deleted successfully.' };
        });
    }

    async options(params, site) {
        const data = await orderRepository.options(params, site);

        if (!data || data.length === 0) {
            const error = new Error('No Rooms found.');
            error.statusCode = 404;
            throw error;
        }

        return data;
    }

    async updateOrderStatus(id, request) {
        const payload = request.body;
        const userId = await getUserId(request);
        const existingOrder = await this.detail(id);
        if (!existingOrder) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }
        console.log(existingOrder.status);
        return knexBooking.transaction(async (trx) => {
            payload.status = payload.status;
            payload.approved_by = userId
            payload.updated_at = formatDateTime();

            const data = await orderRepository.update(id, payload, trx);
            return data;
        });

    }


}

module.exports = new OrderService();