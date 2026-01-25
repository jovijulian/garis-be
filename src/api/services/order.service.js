const orderRepository = require('../repositories/order.repository');
const { getUserId, formatDateTime, parseMenuDescription } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const bookingRepository = require('../repositories/booking.repository');
const roomRepository = require('../repositories/room.repository');
const userRepository = require('../repositories/user.repository');
const orderDetailRepository = require('../repositories/order-detail.repository');
const fs = require('fs');
const path = require('path');
const { sendNewOrderNotificationEmail, sendReorderNotificationEmail, sendOrderStatusUpdateEmail, sendAdminCancellationOrderEmail } = require('./email.service');
const moment = require('moment');
const ExcelJS = require('exceljs');
class OrderService {

    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? orderRepository.findAllWithFilters(queryParams, siteId)
            : orderRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return orderRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await orderRepository.findByIdWithRelations(id, '[details.[consumption_type], cabang, user.[employee], booking, room]');
        if (!data) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async _prepareLocationData(payload) {
        const { booking_id, location_text, cab_id, order_date } = payload;

        if (booking_id) {
            const booking = await bookingRepository.findById(booking_id);
            if (!booking) {
                const error = new Error('Booking not found.');
                error.statusCode = 404;
                throw error;
            }

            const room = await roomRepository.findById(booking.room_id);

            return {
                ...payload,
                cab_id: room.cab_id,
                room_id: booking.room_id,
                location_text: null,
                order_date: moment(order_date || booking.start_time).format("YYYY-MM-DD"),
            };
        }

        if (location_text) {
            if (!cab_id) {
                const error = new Error('Untuk lokasi custom, Cabang/Site wajib diisi.');
                error.statusCode = 400;
                throw error;
            }

            return {
                ...payload,
                room_id: null,
                location_text,
            };
        }

        const error = new Error('Lokasi pesanan (Ruangan atau Lokasi Teks) wajib diisi.');
        error.statusCode = 400;
        throw error;
    }

    async create(request) {
        const userId = await getUserId(request);
        const trx = await knexBooking.transaction();
        let newOrder;
        try {
            const { details, ...header } = request.body;

            const orderPayload = {
                ...header,
                user_id: header.user_id || userId,
                status: 'Submit',
                created_at: formatDateTime(),
                updated_at: formatDateTime(),
            };
            if (header.user_id) {
                orderPayload.status = 'Approved';
            }

            const preparedOrder = await this._prepareLocationData(orderPayload);

            const createdOrder = await orderRepository.create(preparedOrder, trx);

            const detailPayload = details.map(item => ({
                ...item,
                order_id: createdOrder.id,
            }));
            for (const detailItem of detailPayload) {
                await orderDetailRepository.create(detailItem, trx);
            }
            await trx.commit();
            newOrder = await this.detail(createdOrder.id);

        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const admins = await userRepository.findAdminsBySiteId(newOrder.cab_id);
            if (admins.length > 0) {
                const adminEmails = admins.map(admin => admin.email);
                const orderDetails = await this.detail(newOrder.id);
                await sendNewOrderNotificationEmail(adminEmails, orderDetails);
            }
        } catch (error) {
            console.error('Failed to send notification emails to admins.');
        }
        return newOrder;
    }

    async update(id, request) {
        const existingOrder = await this.detail(id);
        if (existingOrder.status !== 'Submit') {
            const error = new Error('This order cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedOrder;

        try {
            const { details, ...header } = request.body;

            const basePayload = {
                ...header,
                pax: header.pax ?? existingOrder.pax,
                consumption_type_id: header.consumption_type_id ?? existingOrder.consumption_type_id,
                menu: header.menu ?? existingOrder.menu,
                order_date: header.order_date ?? existingOrder.order_date,
                updated_at: formatDateTime(),
            };

            const preparedPayload = await this._prepareLocationData(basePayload);

            await orderRepository.update(id, preparedPayload, trx);

            if (details && Array.isArray(details) && details.length > 0) {
                await orderDetailRepository.deleteByOrderId(id, trx);
                const detailPayloads = details.map(item => ({
                    ...item,
                    order_id: Number(id),
                }));
                for (const detail of detailPayloads) {
                    await orderDetailRepository.create(detail, trx);
                }
            }

            await trx.commit();
            updatedOrder = await this.detail(id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const admins = await userRepository.findAdminsBySiteId(updatedOrder.cab_id);
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
            await orderRepository.update(id, { is_active: 0 }, trx);
            // await orderDetailRepository.deleteByOrderId(id, trx);
            return { message: 'Order has been deleted successfully.' };
        });
    }

    async options(params, site) {
        const data = await orderRepository.options(params, site);

        if (!data || data.length === 0) {
            return [];
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
            const requester = await userRepository.findByIdWithRelations(existingOrder.user_id, 'employee');
            if (requester) {
                const email = requester.employee.email;
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

        const menuItemsHtml = order.details.map(item => {
            const deliveryTime = moment(item.delivery_time).format('HH:mm')
            return `
                <tr>
                    <td>${item.consumption_type.name}</td>
                    <td>${item.menu}</td>
                    <td class="col-qty">${item.qty}</td>
                    <td class="col-time">${deliveryTime}</td>
                </tr>
            `;
        }).join('');

        htmlContent = htmlContent.replace('{{orderId}}', order.id);
        htmlContent = htmlContent.replace('{{purpose}}', order.purpose);
        htmlContent = htmlContent.replace('{{orderDate}}', moment(order.order_date).format('DD MMM YYYY'));
        htmlContent = htmlContent.replace('{{requesterName}}', order.user.nama_user);

        const location = order.room ? order.room.name : order.location_text;
        htmlContent = htmlContent.replace('{{location}}', location);

        htmlContent = htmlContent.replace('{{pax}}', order.pax);
        htmlContent = htmlContent.replace('{{menuItems}}', menuItemsHtml);
        htmlContent = htmlContent.replace('{{note}}', order.note);

        return htmlContent;
    }

    async cancelOrder(orderId) {
        const existingOrder = await this.detail(orderId);
        if (!existingOrder) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            const updatedOrder = await orderRepository.update(orderId, { status: 'Canceled', updated_at: formatDateTime() }, trx);
            const orderDetailForEmail = { ...existingOrder, status: 'Canceled' };
            await sendAdminCancellationOrderEmail(orderDetailForEmail);
            return updatedOrder;
        });
    }

    async exportOrdersToExcel(queryParams) {
        const orders = await orderRepository.findAllForExport(queryParams);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Pesanan Konsumsi');

        worksheet.columns = [
            { header: 'ID Pesanan', key: 'order_id', width: 12 },
            { header: 'Status Pesanan', key: 'order_status', width: 15 },
            { header: 'Keperluan', key: 'purpose', width: 35 },
            { header: 'Pemesan', key: 'user_name', width: 30 },
            { header: 'Cabang', key: 'site', width: 20 },
            { header: 'Lokasi', key: 'location', width: 30 },
            { header: 'Terkait Booking ID', key: 'booking_id', width: 18 },

            { header: 'ID Item', key: 'item_id', width: 12 },
            { header: 'Jenis Konsumsi', key: 'consumption_type', width: 25 },
            { header: 'Deskripsi Menu', key: 'menu_description', width: 40 },
            { header: 'Jumlah (Qty)', key: 'qty', width: 15 },
            { header: 'Waktu Dibutuhkan (WIB)', key: 'delivery_time', width: 22 },
        ];

        worksheet.getRow(1).font = { bold: true };

        orders.forEach(order => {
            if (!order.details || order.details.length === 0) {
                return;
            }

            const locationName = order.room ? order.room.name : (order.location_text || '-');

            order.details.forEach(item => {
                worksheet.addRow({
                    order_id: order.id,
                    order_status: order.status,
                    purpose: order.purpose,
                    user_name: order.user ? order.user.nama_user : '-',
                    site: order.cabang ? order.cabang.nama_cab : '-',
                    location: locationName,
                    booking_id: order.booking_id || '-',

                    item_id: item.id,
                    consumption_type: item.consumption_type ? item.consumption_type.name : '-',
                    menu_description: item.menu,
                    qty: item.qty,
                    delivery_time: moment(item.delivery_time).format('YYYY-MM-DD HH:mm'),
                });
            });
        });

        return workbook;
    }
}

module.exports = new OrderService();