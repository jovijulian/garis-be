const reminderRepository = require('../repositories/reminder.repository');
const reminderLogRepository = require('../repositories/reminder-log.repository');
const userRepository = require('../repositories/user.repository');
const { formatDateTime, getCabId, getUserId } = require("../helpers/dataHelpers");
const moment = require('moment-timezone');
const { knexBooking } = require('../../config/database');
const { sendReminderNotificationEmail } = require('./email.service');
class ReminderService {

    async getAll(request, queryParams) {
        const cabId = getCabId(request)
        return reminderRepository.findAllWithFilters(cabId, queryParams);
    }

    async detail(id) {
        const data = await reminderRepository.findByIdWithRelations(id, '[cabang, reminder_type, created_by, updated_by]');
        if (!data) {
            const error = new Error('Reminder not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(request, payload) {
        const cabId = getCabId(request);
        try {
            return knexBooking.transaction(async (trx) => {
                payload.cab_id = cabId;
                payload.created_by = getUserId(request);
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();
                const reminder = await reminderRepository.create(payload, trx);

                return reminder;
            });
        } catch (error) {
            throw error;
        }
    }

    async update(id, payload) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                payload.created_at = formatDateTime();
                payload.updated_at = formatDateTime();
                const reminder = await reminderRepository.update(id, payload, trx);

                return reminder;
            });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const data = await reminderRepository.update(id, { is_active: 0 }, trx);

                if (!data) {
                    const error = new Error('Failed to deleted reminder.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Reminder has been deleted successfully.' };
            });
        } catch (error) {
            throw error;
        }

    }

    async options(params) {
        const data = await reminderRepository.options(params);

        if (!data || data.length === 0) {
            return [];
        }

        return data;
    }

    async processDailyReminders() {
        try {
            console.log(`[CRON] Memulai Proses Pengecekan Reminder...`);

            const currentWibTime = formatDateTime();
            const currentDate = currentWibTime.substring(0, 10);
            const today = moment(currentDate).startOf('day');

            const updatedOverdue = await reminderRepository.updateOverdueReminders(currentDate, currentWibTime);

            if (updatedOverdue > 0) {
                console.log(`[CRON] Berhasil mengubah ${updatedOverdue} reminder menjadi OVERDUE.`);
            }

            const activeReminders = await reminderRepository.checkExistingReminder(currentDate);

            if (!activeReminders.length) {
                console.log('[CRON] Tidak ada reminder aktif yang perlu diproses hari ini.');
                return;
            }


            for (const reminder of activeReminders) {
                if (!reminder.reminder_type || !reminder.reminder_type.notification_intervals) continue;

                let intervals = [];
                try {
                    intervals = JSON.parse(reminder.reminder_type.notification_intervals);
                } catch (e) {
                    console.error(`[CRON] Gagal parsing interval untuk Tipe Reminder ID ${reminder.reminder_type.id}`);
                    continue;
                }

                const dueDate = moment(reminder.due_date).startOf('day');
                const daysLeft = dueDate.diff(today, 'days');

                if (intervals.includes(daysLeft)) {

                    const existingLog = await reminderLogRepository.checkExistingLog(reminder.id, daysLeft);

                    if (!existingLog) {
                        // let adminEmails = [];
                        // const adminsOfSite = await userRepository.findAdminsBySiteId(reminder.cab_id);
                        // adminEmails = adminsOfSite.map(admin => admin.email);
                        const adminEmails = ['azzaspotify123@gmail.com']
                        await sendReminderNotificationEmail(adminEmails, reminder, daysLeft);
                        const logPayload = {
                            reminder_id: reminder.id,
                            days_before: daysLeft,
                            sent_at: formatDateTime()
                        }
                        await reminderLogRepository.create(logPayload);

                        console.log(`[CRON] Berhasil mengirim & mencatat reminder: '${reminder.title}' (H-${daysLeft}).`);
                    }
                }
            }
            console.log(`[CRON] Proses Pengecekan Reminder Selesai.`);
        } catch (error) {
            console.error('[CRON] Error pada saat memproses reminder harian:', error);
        }
    }

    async markAsCompleted(id, request) {
        await this.detail(id);
        try {
            return knexBooking.transaction(async (trx) => {
                const payload = {
                    status: 'COMPLETED',
                    updated_at: formatDateTime(),
                    updated_by: getUserId(request)
                };

                const data = await reminderRepository.update(id, payload, trx);

                if (!data) {
                    const error = new Error('Gagal memperbarui status reminder.');
                    error.statusCode = 500;
                    throw error;
                }

                return { message: 'Reminder berhasil diselesaikan!', data };
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ReminderService();