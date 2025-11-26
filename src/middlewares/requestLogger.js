// src/middlewares/requestLogger.js
const mysql = require('mysql2');

// --- KONFIGURASI DATABASE ---
// Pastikan username, password, dan nama database BENAR
const db = mysql.createPool({
    host: '153.92.5.159',      // Ganti dengan host database Anda
    user: 'HRISC1sangkan',           // Ganti dengan user database Anda
    password: 'Hr12C1s4n6k4n',           // Ganti dengan password database Anda
    database: 'garisDB', // Ganti dengan nama database Anda
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi saat server nyala pertama kali
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ FATAL: Tidak bisa konek ke Database untuk Logger!', err.message);
    } else {
        console.log('✅ Logger berhasil terhubung ke Database.');
        connection.release();
    }
});

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // 1. Ambil Payload
        // Kita harus ubah Object jadi String JSON agar bisa masuk MySQL
        // Jika body kosong, kita simpan string "{}" atau null
        let payloadData = null;
        if (req.body && Object.keys(req.body).length > 0) {
            try {
                payloadData = JSON.stringify(req.body);
            } catch (e) {
                payloadData = "Error parsing JSON";
            }
        }

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            response_time_ms: duration,
            ip_address: req.ip || req.socket.remoteAddress,
            payload: payloadData // <--- Masukkan ke data insert
        };

        const query = 'INSERT INTO request_logs SET ?';

        db.query(query, logData, (err, result) => {
            if (err) {
                // Tampilkan error lengkap ke terminal agar ketahuan salahnya
                console.error("⚠️ Gagal Insert Log:", err.sqlMessage || err);
            } else {
                // Opsional: Nyalakan ini jika ingin memastikan log masuk
                // console.log(`✅ Log tersimpan ID: ${result.insertId}`);
            }
        });
    });

    next();
};

module.exports = requestLogger;