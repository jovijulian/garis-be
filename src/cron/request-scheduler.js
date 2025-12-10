const cron = require('node-cron');
const VehicleRequest = require('@/../../src/api/models/VehicleRequest'); //
const moment = require('moment');

const initScheduler = () => {
    // cron.schedule('* * * * *', async () => {
    cron.schedule('*/10 * * * * *', async () => {
        const nowWIB = moment().format('YYYY-MM-DD HH:mm:ss');
        const nowForQuery = moment().subtract(7, 'hours').format('YYYY-MM-DD HH:mm:ss');
        console.log(`[Scheduler] Checking.. Real Time (WIB): ${nowWIB} | DB Time (UTC): ${nowForQuery}`);

        try {
            await VehicleRequest.query()
                .where('status', 'Approved')
                .andWhere('start_time', '<=', nowForQuery)
                .whereExists(VehicleRequest.relatedQuery('detail'))
                .patch({
                    status: 'In Progress',
                    updated_at: nowWIB
                });

            await VehicleRequest.query()
                .where('status', 'In Progress')
                .andWhere('end_time', '<=', nowForQuery)
                .patch({
                    status: 'Completed',
                    updated_at: nowWIB
                });

            console.log("[Scheduler] Check Completed");
        } catch (err) {
            console.error("Scheduler Error:", err);
        }
    });
}

module.exports = initScheduler;