// src/middlewares/requestLogger.js
const mysql = require('mysql2');

// 1. Konfigurasi Koneksi Database
// (Sebaiknya nanti dipisah ke file config/database.js, tapi untuk tutorial ini kita taruh sini dulu)
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
    // 2. Catat waktu mulai request masuk
    const start = Date.now();

    // 3. Tangkap event ketika response SELESAI dikirim ke user
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Ambil data yang diperlukan
        const logData = {
            method: req.method,
            url: req.originalUrl, // Mengambil URL lengkap
            status_code: res.statusCode,
            response_time_ms: duration,
            ip_address: req.ip || req.connection.remoteAddress
        };

        // 4. Simpan ke Database (Async - tidak memblokir user)
        const query = 'INSERT INTO request_logs SET ?';
        db.query(query, logData, (err, result) => {
            if (err) {
                // Hanya console error agar tidak crash server
                console.error("⚠️ Gagal menyimpan log:", err.message);
            }
        });
    });

    // Lanjut ke router berikutnya
    next();
};

module.exports = requestLogger;