const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('dotenv').config();
const { parseMenuDescription } = require('../helpers/dataHelpers');

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendBookingStatusEmail = async (bookingDetails) => {
    try {
        const { user, room, purpose, start_time, end_time, status } = bookingDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'booking-status.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);
        htmlContent = htmlContent.replace(/{{status}}/g, status);

        const statusClass = status === 'Approved' ? 'status-approved' : 'status-rejected';
        htmlContent = htmlContent.replace(/{{statusClass}}/g, statusClass);

        const mailOptions = {
            from: `"Notifikasi GARIS | PT. Cisangkan" <${process.env.SMTP_USERNAME}>`,
            to: user.email,
            subject: `Pembaruan Status Booking: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi status terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi status:", error);
    }
};

const sendNewBookingNotificationEmail = async (adminEmails, bookingDetails) => {
    try {
        const { user, room, purpose, start_time, end_time, id } = bookingDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'new-booking-notification.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);

        const adminLink = `${process.env.FRONTEND_URL}/manage-booking/${id}`;
        htmlContent = htmlContent.replace(/{{adminLink}}/g, adminLink);

        const mailOptions = {
            from: `"Notifikasi GARIS | PT. Cisangkan" <${process.env.SMTP_USERNAME}>`,
            to: adminEmails.join(','),
            subject: `[TINJAU] Pengajuan Booking Baru: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pengajuan baru terkirim ke admin.`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi ke admin:", error);
    }
};

const sendBookingUpdatedNotificationEmail = async (adminEmails, bookingDetails) => {
    try {
        const { user, room, purpose, start_time, end_time, id } = bookingDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'booking-updated.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);

        const adminLink = `${process.env.FRONTEND_URL}/manage-booking/${id}`;
        htmlContent = htmlContent.replace(/{{adminLink}}/g, adminLink);

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: adminEmails.join(','),
            subject: `[DIUBAH] Pembaruan Booking: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pembaruan terkirim ke admin.`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi pembaruan ke admin:", error);
    }
};

const sendRescheduleNotificationEmail = async (bookingDetails) => {
    try {
        const { user, room, purpose, start_time, end_time, id } = bookingDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'booking-rescheduled.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);

        const userLink = `${process.env.FRONTEND_URL}/manage-booking/my-bookings`;
        htmlContent = htmlContent.replace(/{{userLink}}/g, userLink);

        const mailOptions = {
            from: `"Notifikasi GARIS | PT. Cisangkan" <${process.env.SMTP_USERNAME}>`,
            to: user.email,
            subject: `[DIJADWALKAN ULANG] Booking Anda untuk: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi reschedule terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi reschedule:", error);
    }
};

const sendAutoRejectionEmail = async (rejectedBooking) => {
    try {
        const { user, room, purpose, start_time, end_time } = rejectedBooking;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'booking-rejected-auto.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Ganti placeholder dengan data
        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);

        // Link ke halaman pengajuan booking baru di frontend
        const rescheduleLink = `${process.env.FRONTEND_URL}/manage-booking/create-booking`;
        htmlContent = htmlContent.replace(/{{rescheduleLink}}/g, rescheduleLink);

        const mailOptions = {
            from: `"Notifikasi GARIS | PT. Cisangkan" <${process.env.SMTP_USERNAME}>`,
            to: user.email,
            subject: `[DITOLAK] Pengajuan Booking Anda: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi penolakan otomatis terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi penolakan otomatis:", error);
    }
};

const sendAdminCancellationEmail = async (bookingDetails) => {
    try {
        const { user, room, purpose, start_time, end_time } = bookingDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'booking-canceled-by-admin.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Ganti placeholder dengan data
        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{bookingPurpose}}/g, purpose);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name);
        const bookingTime = `${moment(start_time).format('DD MMM YYYY, HH:mm')} - ${moment(end_time).format('HH:mm')}`;
        htmlContent = htmlContent.replace(/{{bookingTime}}/g, bookingTime);

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: user.email,
            subject: `[DIBATALKAN] Booking Anda untuk: ${purpose}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pembatalan oleh admin terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi pembatalan oleh admin:", error);
    }
};

const sendNewOrderNotificationEmail = async (adminEmails, orderDetails) => {
    try {
        const { user, room, cabang, note, purpose, id, order_date, location_text, details } = orderDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'new-order-notification.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        const orderItemsHtml = details.map(item => `
            <tr>
                <td>${item.consumption_type ? item.consumption_type.name : 'N/A'}</td>
                <td>${item.menu || '-'}</td>
                <td>${item.qty}</td>
                <td>${moment(item.delivery_time).format('DD MMM YYYY, HH:mm')}</td>
            </tr>
        `).join('');

        const location = room ? room.name : (location_text || (cabang ? cabang.nama_cab : 'N/A'));

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{orderDate}}/g, order_date ? moment(order_date).format('DD MMM YYYY') : '-');
        htmlContent = htmlContent.replace(/{{orderPurpose}}/g, purpose || '-');
        htmlContent = htmlContent.replace(/{{location}}/g, location);
        htmlContent = htmlContent.replace(/{{note}}/g, note || '-');
        htmlContent = htmlContent.replace(/{{orderItems}}/g, orderItemsHtml);

        const adminLink = `${process.env.FRONTEND_URL}/orders/manage-order/${id}`;
        htmlContent = htmlContent.replace(/{{adminLink}}/g, adminLink);

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: adminEmails.join(','),
            subject: `[TINJAU] Pengajuan Pesanan Konsumsi Baru: ${purpose || ''}`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pesanan baru terkirim ke admin.`);

    } catch (error) {
        console.log(error)
        console.error("Gagal mengirim email notifikasi pesanan baru ke admin:", error);
    }
};

const sendReorderNotificationEmail = async (adminEmails, orderDetails) => {
    try {
        const { user, room, cabang, note, purpose, id, order_date, location_text, details } = orderDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'update-order-notification.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');
        const orderItemsHtml = details.map(item => `
            <tr>
                <td>${item.consumption_type ? item.consumption_type.name : 'N/A'}</td>
                <td>${item.menu || '-'}</td>
                <td>${item.qty}</td>
                <td>${moment(item.delivery_time).format('DD MMM YYYY, HH:mm')}</td>
            </tr>
        `).join('');

        const location = room ? room.name : (location_text || (cabang ? cabang.nama_cab : 'N/A'));


        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{orderDate}}/g, order_date ? moment(order_date).format('DD MMM YYYY') : '-');
        htmlContent = htmlContent.replace(/{{orderPurpose}}/g, purpose || '-');
        htmlContent = htmlContent.replace(/{{location}}/g, location);
        htmlContent = htmlContent.replace(/{{note}}/g, note || '-');
        htmlContent = htmlContent.replace(/{{orderItems}}/g, orderItemsHtml);

        const adminLink = `${process.env.FRONTEND_URL}/orders/manage-order/${id}`;
        htmlContent = htmlContent.replace(/{{adminLink}}/g, adminLink);

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: adminEmails.join(','),
            subject: `[DIUBAH] Pembaruan Order Konsumsi`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pesanan baru terkirim ke admin.`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi pesanan baru ke admin:", error);
    }
};

const sendOrderStatusUpdateEmail = async (email, orderDetails) => {
    try {
        const { user, room, order_time, status, location_text } = orderDetails;

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'order-status-update.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        let subject, headerClass, message;
        if (status === 'Approved') {
            subject = `[DISETUJUI] Pesanan Konsumsi Anda`;
            headerClass = 'header-approved';
            message = 'Pesanan konsumsi Anda telah disetujui dan akan segera diproses.';
        } else if (status === 'Rejected') {
            subject = `[DITOLAK] Pesanan Konsumsi Anda`;
            headerClass = 'header-rejected';
            message = 'Mohon maaf, pesanan konsumsi Anda telah ditolak. Silakan hubungi Admin GA untuk informasi lebih lanjut.';
        } else {
            subject = `[UPDATE] Status Pesanan Konsumsi Anda`;
            headerClass = 'header-approved';
            message = `Status pesanan konsumsi Anda telah diperbarui menjadi "${status}".`;
        }

        const location = room ? room.name : location_text;

        htmlContent = htmlContent.replace(/{{headerClass}}/g, headerClass);
        htmlContent = htmlContent.replace(/{{status}}/g, status);
        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{message}}/g, message);
        htmlContent = htmlContent.replace(/{{location}}/g, location);
        htmlContent = htmlContent.replace(/{{orderTime}}/g, moment(order_time).format('DD MMM YYYY, HH:mm'));

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: email,
            subject: subject,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi status pesanan terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi status pesanan:", error);
    }
}

const sendAdminCancellationOrderEmail = async (bookingDetails) => {
    try {
        const { user, room, order_time, status, location_text } = bookingDetails;
        const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', 'order-canceled-by-admin.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        htmlContent = htmlContent.replace(/{{userName}}/g, user.nama_user);
        htmlContent = htmlContent.replace(/{{roomName}}/g, room.name || location_text);
        htmlContent = htmlContent.replace(/{{orderTime}}/g, moment(order_time).format('DD MMM YYYY, HH:mm'));

        const mailOptions = {
            from: `"Notifikasi GARIS" <${process.env.SMTP_USERNAME}>`,
            to: user.email,
            subject: `[DIBATALKAN] Order Anda`,
            html: htmlContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`Email notifikasi pembatalan oleh admin terkirim ke ${user.email}`);

    } catch (error) {
        console.error("Gagal mengirim email notifikasi pembatalan oleh admin:", error);
    }
};

module.exports = {
    sendBookingStatusEmail,
    sendNewBookingNotificationEmail,
    sendBookingUpdatedNotificationEmail,
    sendRescheduleNotificationEmail,
    sendAutoRejectionEmail,
    sendAdminCancellationEmail,
    sendNewOrderNotificationEmail,
    sendReorderNotificationEmail,
    sendOrderStatusUpdateEmail,
    sendAdminCancellationOrderEmail,
};