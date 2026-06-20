const reminderRepository = require('../repositories/reminder.repository');
const reminderLogRepository = require('../repositories/reminder-log.repository');
const userRepository = require('../repositories/user.repository');
const { formatDateTime, getCabId, getUserId } = require("../helpers/dataHelpers");
const moment = require('moment-timezone');
const { knexBooking } = require('../../config/database');
const { sendReminderNotificationEmail } = require('./email.service');
class ReminderService {

    async generateBaseCode() {
        const date = new Date();
        const ym = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const random = Math.floor(1000 + Math.random() * 9000);
        return `RMDR-${ym}-${random}`;
    }

    async getAll(request, queryParams) {
        const cabId = getCabId(request)

        return reminderRepository.findAllWithFilters(cabId, queryParams);
    }

    async detail(id) {
        const data = await reminderRepository.findByIdWithRelations(id, '[cabang, reminder_type, created_by_user, updated_by_user]');
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
                payload.reminder_code = await this.generateBaseCode();
                payload.extension_count = 0;
                payload.parent_id = null;
                payload.status = 'PENDING';


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
        const reminder = await this.detail(id);

        try {
            return knexBooking.transaction(async (trx) => {
                const rootId = reminder.parent_id ? reminder.parent_id : reminder.id;
                await reminderRepository.deleteChain(rootId, trx);

                return { message: 'Pengingat beserta seluruh historinya berhasil dihapus dan dihentikan.' };
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
                        let adminEmails = [];
                        const adminsOfSite = await userRepository.findAdminsBySiteId(reminder.cab_id);
                        adminEmails = adminsOfSite.map(admin => admin.email);
                        // const adminEmails = ['azzaspotify123@gmail.com']
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
        const oldReminder = await this.detail(id);
        const userId = getUserId(request);
        const payload = request.body;
        const file = request.file;

        if (oldReminder.status === 'COMPLETED') {
            throw { statusCode: 400, message: 'Pengingat ini sudah diselesaikan sebelumnya.' };
        }

        try {
            return knexBooking.transaction(async (trx) => {
                const now = formatDateTime();

                const updatePayload = {
                    status: 'COMPLETED',
                    cost: payload.cost ? Number(payload.cost) : 0,
                    updated_at: now,
                    updated_by: userId
                };

                if (file) {
                    updatePayload.attachment_path = `uploads/${file.filename}`;
                }

                await reminderRepository.update(id, updatePayload, trx);

                let newReminder = null;

                if (oldReminder.is_recurring === 1 && payload.next_due_date) {

                    const newExtensionCount = oldReminder.extension_count + 1;
                    const rootId = oldReminder.parent_id ? oldReminder.parent_id : oldReminder.id;

                    const baseCode = oldReminder.reminder_code.split('-').slice(0, 3).join('-');
                    const newCode = `${baseCode}-${newExtensionCount}`;

                    const newReminderPayload = {
                        reminder_type_id: oldReminder.reminder_type_id,
                        title: oldReminder.title,
                        cab_id: oldReminder.cab_id,
                        description: oldReminder.description,
                        identity_number: oldReminder.identity_number,
                        due_date: payload.next_due_date,
                        is_recurring: oldReminder.is_recurring,
                        reminder_code: newCode,
                        parent_id: rootId,
                        extension_count: newExtensionCount,
                        status: 'PENDING',
                        created_by: userId,
                        created_at: now,
                        updated_at: now
                    };

                    newReminder = await reminderRepository.create(newReminderPayload, trx);
                }

                return {
                    message: newReminder
                        ? 'Pengingat selesai dan periode berikutnya berhasil dibuat!'
                        : 'Pengingat berhasil diselesaikan!',
                    data: oldReminder
                };
            });
        } catch (error) { throw error; }
    }

    async getHistoryByReminderId(id) {
        await this.detail(id)
        const data = await reminderRepository.getHistoryByReminderId(id)
        return data;
    }

    async uploadProof(id, request) {
        const reminder = await this.detail(id);
        const file = request.file;
        const userId = getUserId(request);
        const cost = request.body.cost;


        try {
            if (!reminder) {
                const fs = require('fs');
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

                throw { statusCode: 404, message: 'Reminder tidak ditemukan.' };
            }
            return knexBooking.transaction(async (trx) => {
                const updatePayload = {
                    attachment_path: file ? `uploads/${file.filename}` : null,
                    cost: cost,
                    updated_at: formatDateTime(),
                    updated_by: userId
                };

                const updatedReminder = await reminderRepository.update(id, updatePayload, trx);


                return {
                    message: 'Bukti pengingat berhasil disusulkan/diunggah.',
                    data: updatedReminder
                };
            });
        } catch (error) {
            if (file && file.path) {
                const fs = require('fs');
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }

            throw error;
        }
    }
}

module.exports = new ReminderService();