const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('dotenv').config();

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
            from: `"Notifikasi GA" <${process.env.SMTP_USERNAME}>`,
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
            from: `"Notifikasi GA" <${process.env.SMTP_USERNAME}>`,
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

module.exports = {
    sendBookingStatusEmail,
    sendNewBookingNotificationEmail,
    sendBookingUpdatedNotificationEmail,
    sendRescheduleNotificationEmail,
    sendAutoRejectionEmail,
    sendAdminCancellationEmail,
};