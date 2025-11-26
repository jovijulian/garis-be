// src/middlewares/requestLogger.js
const mysql = require('mysql2');

// --- KONFIGURASI DATABASE ---
const db = mysql.createPool({
    host: '153.92.5.159',      // Ganti dengan host database Anda
    user: 'HRISC1sangkan',           // Ganti dengan user database Anda
    password: 'Hr12C1s4n6k4n',           // Ganti dengan password database Anda
    database: 'garisDB', // Ganti dengan nama database Anda
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // --- TEKNIK INTERSEPSI (MONKEY PATCHING) ---
    // 1. Simpan fungsi asli res.send ke variabel sementara
    const originalSend = res.send;

    // 2. Buat variabel untuk menampung respon body
    let savedResponseBody = null;

    // 3. Timpa res.send dengan fungsi kita sendiri
    res.send = function (body) {
        // Simpan body yang mau dikirim ke variabel kita
        savedResponseBody = body;
        
        // Kembalikan fungsi asli agar respon tetap terkirim ke user
        return originalSend.call(this, body);
    };
    // -------------------------------------------

    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // A. Proses Request Payload (Apa yang dikirim user)
        let requestPayload = null;
        if (req.body && Object.keys(req.body).length > 0) {
            try {
                requestPayload = JSON.stringify(req.body);
            } catch (e) {}
        }

        // B. Proses Response Body (Pesan Error/Sukses dari server)
        let responseMessage = null;
        if (savedResponseBody) {
            try {
                // Cek apakah outputnya Object/JSON atau String biasa
                if (typeof savedResponseBody === 'object') {
                    responseMessage = JSON.stringify(savedResponseBody);
                } else {
                    responseMessage = savedResponseBody;
                }
            } catch (e) {
                responseMessage = "Error parsing response";
            }
        }

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            response_time_ms: duration,
            ip_address: req.ip || req.socket.remoteAddress,
            payload: requestPayload,        // Request dari user
            response_body: responseMessage  // <--- Balasan dari server (Error/Sukses)
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