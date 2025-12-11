const mysql = require('mysql2');
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,   
    password: process.env.DB_PASSWORD,   
    database:  process.env.DB_NAME,   
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    let savedResponseBody = null;
    res.send = function (body) {
        savedResponseBody = body;
        return originalSend.call(this, body);
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        let requestPayload = null;
        if (req.body && Object.keys(req.body).length > 0) {
            try {
                requestPayload = JSON.stringify(req.body);
            } catch (e) {}
        }

        let responseMessage = null;
        if (savedResponseBody) {
            try {
                if (typeof savedResponseBody === 'object') {
                    responseMessage = JSON.stringify(savedResponseBody);
                } else {
                    responseMessage = savedResponseBody;
                }
            } catch (e) {
                responseMessage = "Error parsing response";
            }
        }

        let userId = null;
        if (req.user) {
            userId = req.user.id_user || req.user.id_user || req.user.id_user || null;
        }

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            response_time_ms: duration,
            ip_address: req.ip || req.socket.remoteAddress,
            payload: requestPayload,    
            id_user: userId,    
            response_body: responseMessage  
        };

        const query = 'INSERT INTO request_logs SET ?';

        db.query(query, logData, (err, result) => {
            if (err) {
                console.error("⚠️ Gagal Insert Log:", err.message);
            }
        });
    });

    next();
};

module.exports = requestLogger;