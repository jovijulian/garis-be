const orderRepository = require('../repositories/order.repository');
const { getUserId, formatDateTime, parseMenuDescription } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
const userRepository = require('../repositories/user.repository');
const fs = require('fs');
const path = require('path');
const { sendNewOrderNotificationEmail, sendReorderNotificationEmail, sendOrderStatusUpdateEmail } = require('./email.service');
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

    async _prepareLocationData(payload) {
        const { booking_id, room_id, location_text } = payload;

        if (booking_id) {
            const relatedBooking = await bookingRepository.findById(booking_id);
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
        } else if (room_id) {
            const relatedRoom = await roomRepository.findById(room_id);
            if (!relatedRoom) {
                const error = new Error('Room not found.');
                error.statusCode = 404;
                throw error;
            }
            payload.cab_id = relatedRoom.cab_id;
            payload.location_text = null;
        } else if (location_text) {
            payload.room_id = null;
            payload.location_text = location_text;
        } else {
            throw { statusCode: 400, message: "Lokasi pesanan (Ruangan atau Lokasi Teks) wajib diisi." };
        }
        return payload;
    }

    async create(request) {
        const userId = await getUserId(request);
        let payload = request.body;
        const trx = await knexBooking.transaction();
        let newOrder;
        try {
            payload = await this._prepareLocationData(payload);

            payload.pax = payload.pax;
            payload.user_id = payload.user_id || userId;
            payload.status = 'Submit';
            payload.created_at = formatDateTime();
            payload.updated_at = formatDateTime();
            newOrder = await orderRepository.create(payload, trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const admins = await userRepository.findAdminsBySiteId(payload.cab_id);
            if (admins.length > 0) {
                const adminEmails = admins.map(admin => admin.email);
                const orderDetails = await this.detail(newOrder.id);
                await sendNewOrderNotificationEmail(adminEmails, orderDetails);
            }
        } catch (error) {
            console.error(error)
            console.error('Failed to send notification emails to admins.');
        }
        return newOrder;

    }

    async update(id, request) {
        let payload = request.body;
        const existingOrder = await this.detail(id);


        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
        const trx = await knexBooking.transaction();
        let updatedOrder;
        try {
            payload = await this._prepareLocationData(payload);

            payload.pax = payload.pax || existingOrder.pax;
            payload.consumption_type_id = payload.consumption_type_id || existingOrder.consumption_type_id;
            payload.menu_description = payload.menu_description || existingOrder.menu_description;
            payload.order_time = payload.order_time || existingOrder.order_time;
            payload.updated_at = formatDateTime();
            updatedOrder = await orderRepository.update(id, payload, trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const admins = await userRepository.findAdminsBySiteId(payload.cab_id);
            if (admins.length > 0) {
                const adminEmails = admins.map(admin => admin.email);
                const orderDetails = await this.detail(id);
                await sendReorderNotificationEmail(adminEmails, orderDetails);
            }
        } catch (error) {
            console.error(error)
            console.error('Failed to send notification emails to admins.');
        }
        return updatedOrder;
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
        let payload = request.body;
        const userId = await getUserId(request);
        const existingOrder = await this.detail(id);
        if (!existingOrder) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }
        const trx = await knexBooking.transaction();
        let updatedOrder;
        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order status cannot be changed as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }
        try {
            payload.status = payload.status;
            payload.approved_by = userId
            payload.updated_at = formatDateTime();

            updatedOrder = await orderRepository.update(id, payload, trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const requester = await userRepository.findById(existingOrder.user_id);
            if (requester) {
                const email = requester.email;
                const orderDetails = await this.detail(id);
                await sendOrderStatusUpdateEmail(email, orderDetails);
            }
        } catch (error) {
            console.error('Failed to send notification email to requester.');
        }
        return updatedOrder;

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