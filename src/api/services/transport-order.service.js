const transportOrderRepository = require('../repositories/transport-order.repository');
const transportPassengerRepository = require('../repositories/transport-passenger.repository');
const userRepository = require('../repositories/user.repository');
const { getUserId, formatDateTime } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { sendNewTransportOrderNotificationEmail, sendRenewTransportOrderNotificationEmail, sendTransportOrderStatusUpdateEmail, sendAdminCancellationTransportOrderEmail } = require('./email.service');

class TransportOrderService {

    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? transportOrderRepository.findAllWithFilters(queryParams, siteId)
            : transportOrderRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return transportOrderRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await transportOrderRepository.findByIdWithRelations(id, '[passengers, cabang, user.[employee], transport_type]');
        if (!data) {
            const error = new Error('Transport order not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    _calculatePassengerSummary(passengers) {
        if (!Array.isArray(passengers)) return { total_pax: 0 };
        return { total_pax: passengers.length };
    }

    async create(request) {
        const userId = await getUserId(request);
        const trx = await knexBooking.transaction();
        let newOrder;

        try {
            const { passengers, ...header } = request.body;
            const passengerSummary = passengers && passengers.length > 0
                ? this._calculatePassengerSummary(passengers)
                : { total_pax: header.total_pax || 1 };

            const orderPayload = {
                ...header,
                user_id: header.user_id || userId,
                total_pax: passengerSummary.total_pax,
                status: header.user_id ? 'Approved' : 'Submit',
                created_at: formatDateTime(),
                updated_at: formatDateTime(),
            };

            const createdOrder = await transportOrderRepository.create(orderPayload, trx);

            if (passengers && passengers.length > 0) {
                const passengerPayload = passengers.map(p => ({
                    transport_order_id: createdOrder.id,
                    passenger_name: p.passenger_name,
                    phone_number: p.phone_number || null
                }));

                for (const item of passengerPayload) {
                    await transportPassengerRepository.create(item, trx);
                }
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
                await sendNewTransportOrderNotificationEmail(admins.map(a => a.email), newOrder);
            }
        } catch (error) {
            console.error('Failed to send transport notification.');
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
            const { passengers, ...header } = request.body;
            const passengerSummary = passengers ? this._calculatePassengerSummary(passengers) : {};

            const updatePayload = {
                ...header,
                ...passengerSummary,
                updated_at: formatDateTime(),
            };

            await transportOrderRepository.update(id, updatePayload, trx);
            if (passengers && Array.isArray(passengers)) {
                await transportPassengerRepository.deleteByOrderId(id, trx);

                const passengerPayloads = passengers.map(item => ({
                    transport_order_id: Number(id),
                    passenger_name: item.passenger_name,
                    phone_number: item.phone_number || null
                }));

                for (const p of passengerPayloads) {
                    await transportPassengerRepository.create(p, trx);
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
                await sendRenewTransportOrderNotificationEmail(admins.map(a => a.email), updatedOrder);
            }
        } catch (error) {
            console.error('Failed to send accommodation notification.');
        }

        return updatedOrder;
    }

    async delete(id) {
        const existingOrder = await this.detail(id);
        if (existingOrder.status !== 'Submit') {
            const error = new Error('Order cannot be deleted.');
            error.statusCode = 400;
            throw error;
        }
        return knexBooking.transaction(async (trx) => {
            await transportOrderRepository.update(id, { is_active: 0, updated_at: formatDateTime() }, trx);
            return { message: 'Transport order deleted successfully.' };
        });
    }

    async updateOrderStatus(id, request) {
        const userId = await getUserId(request);
        const existingOrder = await this.detail(id);
        if (!existingOrder) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }
        const { status } = request.body;
        let updatedOrder;

        const trx = await knexBooking.transaction();
        try {
            updatedOrder = await transportOrderRepository.update(id, {
                status: status,
                approved_by: userId,
                updated_at: formatDateTime()
            }, trx);
            await trx.commit();

        } catch (error) {
            await trx.rollback();
            throw error;
        }

        try {
            const requester = await userRepository.findByIdWithRelations(existingOrder.user_id, '[employee]');
            if (requester) {
                const email = requester.employee.email;
                const orderDetails = await this.detail(id);
                await sendTransportOrderStatusUpdateEmail(email, orderDetails);
            }
        } catch (error) {
            console.error('Failed to send notification email to requester.');
        }

        return updatedOrder;
    }

    async cancelOrder(orderId) {
        const existingOrder = await this.detail(orderId);
        if (!existingOrder) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }
        return knexBooking.transaction(async (trx) => {
            const updatedOrder = await transportOrderRepository.update(orderId, {
                status: 'Canceled',
                updated_at: formatDateTime()
            }, trx);

            const orderDetailForEmail = { ...existingOrder, status: 'Canceled' };
            await sendAdminCancellationTransportOrderEmail(orderDetailForEmail);

            return updatedOrder;
        });
    }

    async generateReceiptHtml(orderId) {
        const order = await this.detail(orderId);
        const templatePath = path.join(__dirname, '..', '..', 'templates', 'receipt', 'transport-order-receipt.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error("Receipt template not found.");
        }

        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        const passengerItemsHtml = order.passengers.map((p, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${p.passenger_name}</td>
                    <td>${p.phone_number || '-'}</td>
                </tr>
            `;
        }).join('');

        htmlContent = htmlContent.replace('{{orderId}}', order.id);
        htmlContent = htmlContent.replace('{{siteName}}', order.cabang ? order.cabang.nama_cab : '-');
        htmlContent = htmlContent.replace('{{requesterName}}', order.user ? order.user.nama_user : '-');
        htmlContent = htmlContent.replace('{{purpose}}', order.purpose);
        htmlContent = htmlContent.replace('{{date}}', moment(order.date).format('DD MMM YYYY'));
        htmlContent = htmlContent.replace('{{time}}', order.time);
        htmlContent = htmlContent.replace('{{transportType}}', order.transport_type ? order.transport_type.name : '-');
        htmlContent = htmlContent.replace('{{origin}}', `${order.origin} (${order.origin_detail || '-'})`);
        htmlContent = htmlContent.replace('{{destination}}', `${order.destination} (${order.destination_detail || '-'})`);
        htmlContent = htmlContent.replace('{{transportClass}}', order.transport_class || '-');
        htmlContent = htmlContent.replace('{{preferredProvider}}', order.preferred_provider || '-');
        htmlContent = htmlContent.replace('{{passengerList}}', passengerItemsHtml);
        htmlContent = htmlContent.replace('{{note}}', order.note || '-');
        htmlContent = htmlContent.replace('{{createdAt}}', moment(order.created_at).format('DD MMM YYYY'));

        return htmlContent;
    }

    async exportOrdersToExcel(queryParams) {
        const orders = await transportOrderRepository.findAllForExport(queryParams);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Pesanan Transportasi');
        worksheet.columns = [
            { header: 'ID', key: 'order_id', width: 10 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Pemesan', key: 'user_name', width: 25 },
            { header: 'Site', key: 'site', width: 15 },
            { header: 'Keperluan', key: 'site', width: 15 },
            { header: 'Jenis Kendaraan', key: 'transport_type', width: 20 },
            { header: 'Asal', key: 'origin', width: 20 },
            { header: 'Tujuan', key: 'destination', width: 20 },
            { header: 'Tgl Berangkat', key: 'date', width: 15 },
            { header: 'Jam', key: 'time', width: 10 },
            { header: 'Total Pax', key: 'total_pax', width: 10 },
            { header: 'Daftar Penumpang', key: 'passenger_list', width: 50 },
            { header: 'Kelas Transportasi', key: 'transport_class', width: 20 },
            { header: 'Provider / Maskapai', key: 'preferred_provider', width: 20 },
            { header: 'Catatan', key: 'note', width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };

        orders.forEach(order => {
            const passengerListNames = order.passengers && order.passengers.length > 0
                ? order.passengers.map(p => p.passenger_name).join(', ')
                : '-';

            worksheet.addRow({
                order_id: order.id,
                status: order.status,
                user_name: order.user ? order.user.nama_user : '-',
                site: order.cabang ? order.cabang.nama_cab : '-',
                purpose: order.purpose,
                transport_type: order.transport_type ? order.transport_type.name : '-',
                origin: order.origin,
                destination: order.destination,
                date: moment(order.date).format('YYYY-MM-DD'),
                time: order.time,
                total_pax: order.total_pax || 0,
                passenger_list: passengerListNames,
                transport_class: order.transport_class || '-',
                preferred_provider: order.preferred_provider || '-',
                note: order.note || '-',
            });
        });

        return workbook;
    }
}

module.exports = new TransportOrderService();