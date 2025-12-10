const cron = require('node-cron');
const VehicleRequest = require('@/../../src/api/models/VehicleRequest'); //
const moment = require('moment');

const initScheduler = () => {
    cron.schedule('* * * * *', async () => {
        // cron.schedule('*/10 * * * * *', async () => {
        const nowWIB = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
        const nowForQuery = moment().utc().format("YYYY-MM-DD HH:mm:ss");
        console.log(`[Scheduler] Checking.. Real Time (WIB): ${nowWIB} | DB Time (UTC): ${nowForQuery}`);

        try {
            await VehicleRequest.query()
                .where('status', 'Approved')
                .andWhere('start_time', '<=', nowForQuery)
                .whereExists(VehicleRequest.relatedQuery('detail'))
                .patch({
                    status: 'In Progress',
                    updated_at: nowForQuery
                });

            await VehicleRequest.query()
                .where('status', 'In Progress')
                .andWhere('end_time', '<=', nowForQuery)
                .patch({
                    status: 'Completed',
                    updated_at: nowForQuery
                });

            console.log("[Scheduler] Check Completed");
        } catch (err) {
            console.error("Scheduler Error:", err);
        }
    });
}

module.exports = initScheduler;