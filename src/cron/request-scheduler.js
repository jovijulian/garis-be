const cron = require('node-cron');
const VehicleRequest = require('@/../../src/api/models/VehicleRequest'); 
const moment = require('moment-timezone');

const initScheduler = () => {
    cron.schedule('* * * * *', async () => {
        
        const nowCurrent = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
        
        console.log(`[Scheduler] Running Check at: ${nowCurrent}`);

        try {
            await VehicleRequest.query()
                .where('status', 'Approved')
                .andWhere('start_time', '<=', nowCurrent) 
                .whereExists(VehicleRequest.relatedQuery('detail'))
                .patch({
                    status: 'In Progress',
                    updated_at: nowCurrent
                });

            await VehicleRequest.query()
                .where('status', 'In Progress')
                .andWhere('end_time', '<=', nowCurrent) 
                .patch({
                    status: 'Completed',
                    updated_at: nowCurrent
                });

        } catch (err) {
            console.error("Scheduler Error:", err);
        }
    });
}

module.exports = initScheduler;