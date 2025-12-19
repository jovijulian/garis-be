const accommodationOrderRepository = require('../repositories/accommodation-order.repository');
const accommodationGuestRepository = require('../repositories/accommodation-guest.repository');
const userRepository = require('../repositories/user.repository');
const { getUserId, formatDateTime } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { sendNewAccommodationNotificationEmail, sendRenewAccommodationNotificationEmail, sendAccommodationStatusUpdateEmail, sendAdminCancellationAccommodationEmail } = require('./email.service');

class AccommodationOrderService {

    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? accommodationOrderRepository.findAllWithFilters(queryParams, siteId)
            : accommodationOrderRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return accommodationOrderRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await accommodationOrderRepository.findByIdWithRelations(id, '[guests, cabang, user.[employee]]');
        if (!data) {
            const error = new Error('Accommodation order not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    _calculateGuestSummary(guests) {
        if (!Array.isArray(guests)) return { total_pax: 0, total_male: 0, total_female: 0 };

        const total_pax = guests.length;
        const total_male = guests.filter(g => g.gender === 'Laki-laki').length;
        const total_female = guests.filter(g => g.gender === 'Perempuan').length;

        return { total_pax, total_male, total_female };
    }

    async create(request) {
        const userId = await getUserId(request);
        const trx = await knexBooking.transaction();
        let newOrder;

        try {
            const { guests, ...header } = request.body;
            const guestSummary = this._calculateGuestSummary(guests);

            const orderPayload = {
                ...header,
                user_id: header.user_id || userId,
                ...guestSummary,
                status: header.user_id ? 'Approved' : 'Submit',
                created_at: formatDateTime(),
                updated_at: formatDateTime(),
            };

            const createdOrder = await accommodationOrderRepository.create(orderPayload, trx);
            if (guests && guests.length > 0) {
                const guestPayload = guests.map(guest => ({
                    accommodation_order_id: createdOrder.id,
                    guest_name: guest.guest_name,
                    gender: guest.gender
                }));

                for (const item of guestPayload) {
                    await accommodationGuestRepository.create(item, trx);
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
                await sendNewAccommodationNotificationEmail(admins.map(a => a.email), newOrder);
            }
        } catch (error) {
            console.error('Failed to send accommodation notification.');
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
            const { guests, ...header } = request.body;
            const guestSummary = guests ? this._calculateGuestSummary(guests) : {};


            const updatePayload = {
                ...header,
                ...guestSummary,
                updated_at: formatDateTime(),
            };

            await accommodationOrderRepository.update(id, updatePayload, trx);
            if (guests && Array.isArray(guests)) {
                await accommodationGuestRepository.deleteByOrderId(id, trx);
                const guestPayloads = guests.map(item => ({
                    ...item,
                    accommodation_order_id: Number(id),
                }));
                for (const guest of guestPayloads) {
                    await accommodationGuestRepository.create(guest, trx);
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
                await sendRenewAccommodationNotificationEmail(admins.map(a => a.email), updatedOrder);
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
            // await accommodationGuestRepository.deleteByOrderId(id, trx);
            await accommodationOrderRepository.update(id, { is_active: 0 }, trx);
            return { message: 'Accommodation order deleted successfully.' };
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
            updatedOrder = await accommodationOrderRepository.update(id, {
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
                await sendAccommodationStatusUpdateEmail(email, orderDetails);
            }
        } catch (error) {
            console.error('Failed to send notification email to requester.');
        }
        return updatedOrder;
    }

    async cancelOrder(orderId) {
        const existingOrder = await this.detail(orderId);
        if (!existingOrder) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            const updatedOrder = await accommodationOrderRepository.update(orderId, { status: 'Canceled', updated_at: formatDateTime() }, trx);
            const orderDetailForEmail = { ...existingOrder, status: 'Canceled' };
            await sendAdminCancellationAccommodationEmail(orderDetailForEmail);
            return updatedOrder;
        });
    }

    async generateReceiptHtml(orderId) {
        const order = await this.detail(orderId);
        if (!order) {
            const error = new Error("Accommodation order not found.");
            error.statusCode = 404;
            throw error;
        }

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'receipt', 'accommodation-receipt.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');
        const guestItemsHtml = order.guests.map((guest, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${guest.guest_name}</td>
                    <td>${guest.gender}</td>
                </tr>
            `;
        }).join('');

        htmlContent = htmlContent.replace('{{orderId}}', order.id);
        htmlContent = htmlContent.replace('{{siteName}}', order.cabang ? order.cabang.nama_cab : '-');
        htmlContent = htmlContent.replace('{{requesterName}}', order.user ? order.user.nama_user : '-');
        htmlContent = htmlContent.replace('{{checkIn}}', moment(order.check_in_date).utcOffset('+07:00').format('DD MMM YYYY'));
        htmlContent = htmlContent.replace('{{checkOut}}', moment(order.check_out_date).utcOffset('+07:00').format('DD MMM YYYY'));
        htmlContent = htmlContent.replace('{{roomNeeded}}', order.room_needed || '-');
        htmlContent = htmlContent.replace('{{totalPax}}', order.total_pax);
        htmlContent = htmlContent.replace('{{male}}', order.total_male);
        htmlContent = htmlContent.replace('{{female}}', order.total_female);

        htmlContent = htmlContent.replace('{{guestList}}', guestItemsHtml);
        htmlContent = htmlContent.replace('{{note}}', order.note || '-');

        return htmlContent;
    }

    async exportOrdersToExcel(queryParams) {
        const orders = await accommodationOrderRepository.findAllForExport(queryParams);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Pesanan Akomodasi');
        worksheet.columns = [
            { header: 'ID Pesanan', key: 'order_id', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Pemesan', key: 'user_name', width: 30 },
            { header: 'Site/Cabang', key: 'site', width: 15 },
            { header: 'Check In', key: 'check_in', width: 15 },
            { header: 'Check Out', key: 'check_out', width: 15 },
            { header: 'Kebutuhan Kamar', key: 'room_needed', width: 20 },
            { header: 'Total Orang', key: 'total_pax', width: 12 },
            { header: 'Laki-laki', key: 'male', width: 10 },
            { header: 'Perempuan', key: 'female', width: 10 },
            { header: 'Daftar Nama Tamu', key: 'guest_list', width: 60 },
            { header: 'Catatan', key: 'note', width: 60 },
        ];

        worksheet.getRow(1).font = { bold: true };

        orders.forEach(order => {
            const guestListNames = order.guests && order.guests.length > 0
                ? order.guests.map(g => `${g.guest_name} (${g.gender})`).join(', ')
                : '-';

            worksheet.addRow({
                order_id: order.id,
                status: order.status,
                user_name: order.user ? order.user.nama_user : '-',
                site: order.cabang ? order.cabang.nama_cab : '-',
                check_in: moment(order.check_in_date).format('YYYY-MM-DD'),
                check_out: moment(order.check_out_date).format('YYYY-MM-DD'),
                room_needed: order.room_needed || '-',
                total_pax: order.total_pax || 0,
                male: order.total_male || 0,
                female: order.total_female || 0,
                guest_list: guestListNames,
                note: order.note || '-',
            });
        });

        return workbook;
    }
}

module.exports = new AccommodationOrderService();