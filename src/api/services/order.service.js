const orderRepository = require('../repositories/order.repository');
const { getUserId, formatDateTime } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
const fs = require('fs');
const path = require('path');
const { parseMenuDescription } = require('../helpers/dataHelpers');
const moment = require('moment');
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

    async update(id, request) {
        const payload = request.body;
        const existingOrder = await this.detail(id);
        const roomId = payload.room_id
        const locationText = payload.location_text
        const bookingId = payload.booking_id
       
        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
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

    async generateReceiptHtml(orderId) {
        const order = await this.detail(orderId);
        if (!order) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'receipt', 'order-receipt.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');
        
        const menuItemsArray = parseMenuDescription(order.menu_description);
        const menuItemsHtml = menuItemsArray.map(item => `<tr><td>${item}</td></tr>`).join('');

        htmlContent = htmlContent.replace('{{orderId}}', order.id);
        htmlContent = htmlContent.replace('{{orderDate}}', moment(order.created_at).utcOffset('+07:00').format('DD MMM YYYY'));
        htmlContent = htmlContent.replace('{{requesterName}}', order.user.nama_user);
        
        const location = order.room ? order.room.name : order.location_text;
        htmlContent = htmlContent.replace('{{location}}', location);
        
        htmlContent = htmlContent.replace('{{consumptionTime}}', moment(order.order_time).utcOffset('+07:00').format('DD MMM YYYY, HH:mm'));
        htmlContent = htmlContent.replace('{{pax}}', order.pax);
        htmlContent = htmlContent.replace('{{menuItems}}', menuItemsHtml);
        htmlContent = htmlContent.replace('{{note}}', order.note);

        return htmlContent;
    }


}

module.exports = new OrderService();