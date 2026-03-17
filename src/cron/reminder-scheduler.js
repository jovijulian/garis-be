const cron = require('node-cron');
const reminderService = require('@/../../src/api/services/reminder.service');
const moment = require('moment-timezone');

const initReminder = () => {
    cron.schedule('0 8 * * *', async () => {
        // cron.schedule('* * * * *', async () => {
        const nowCurrent = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
        console.log(`[CRON] Menjalankan pengecekan Reminder Harian pada ${nowCurrent}`);
        await reminderService.processDailyReminders();
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    console.log('[CRON] Schedulers telah diinisialisasi.');
}

module.exports = initReminder;