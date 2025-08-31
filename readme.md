# Aplikasi Booking Ruangan Kantor

Aplikasi web sederhana untuk mengelola pemesanan (booking) ruangan kantor, dibangun menggunakan Next.js untuk frontend dan Express.js untuk backend.

---

## Fitur Utama

### Untuk User Biasa

- **Login**: Autentikasi pengguna untuk masuk ke dasbor pribadi.
- **Buat Booking**: Mengajukan pemesanan ruangan baru melalui form interaktif.
- **Lihat Daftar Booking**: Menampilkan semua riwayat booking yang pernah dibuat oleh user.
- **Edit & Hapus Booking**: Pengguna dapat mengubah atau membatalkan booking selama statusnya masih **"Submit"**.

### Untuk Admin

- \**Lihat Semua Booking*a\*: Menampilkan daftar lengkap semua booking dari semua user.
- **Ubah Status**: Menyetujui (`Approved`) atau menolak (`Rejected`) booking yang diajukan.
- **Manajemen Konflik**:
  - Saat admin menyetujui satu booking, sistem secara otomatis akan menolak (`Rejected`) booking lain yang bentrok dan masih berstatus "Submit".
  - Terdapat indikator visual untuk menandai booking yang jadwalnya tumpang tindih.
- **Atur Ulang Jadwal (Reschedule)**: Fitur tambahan bagi admin untuk memindahkan jadwal booking yang bentrok ke tanggal atau waktu lain yang tersedia, sebagai alternatif selain langsung menolaknya.

---

## Struktur Proyek

Aplikasi ini dibangun dengan arsitektur terpisah antara frontend dan backend untuk skalabilitas dan kemudahan pengelolaan.

### Backend (Express.js)

Backend menggunakan arsitektur berlapis (_Layered Architecture_) untuk memisahkan setiap tanggung jawab dengan jelas:

- **Routes**: Mendefinisikan semua endpoint API yang tersedia.
- **Controllers**: Menerima request dari client, memvalidasi input, dan memanggil service yang sesuai.
- **Services**: Berisi semua logika bisnis inti (misalnya, pengecekan jadwal bentrok, logika otorisasi).
- **Repositories**: Satu-satunya lapisan yang bertanggung jawab untuk berkomunikasi langsung dengan database (menjalankan query SQL).

### Frontend (Next.js)

Frontend dibangun menggunakan Next.js dengan App Router dan arsitektur berbasis komponen:

- **`app/`**: Direktori utama yang menangani routing halaman dan API routes.
- **`components/`**: Berisi komponen-komponen UI yang dapat digunakan kembali di seluruh aplikasi (misalnya, Modal, TimePicker, Badge).
- **`helpers/`**: Berisi fungsi-fungsi bantuan, seperti untuk melakukan panggilan API ke backend.

---

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: MySQL
- **Lainnya**: JWT (JSON Web Tokens) untuk autentikasi, Bcrypt.js untuk hashing password, Zod untuk validasi.

---

## Cara Menjalankan Aplikasi

### Prasyarat

- Node.js (v18 atau lebih baru)
- NPM / Yarn
- Server MySQL yang sedang berjalan

### 1. Backend Setup (`booking-be`)

1.  **Navigasi ke Folder Backend**:
    ```bash
    cd booking-be
    ```
2.  **Instalasi Dependensi**:
    ```bash
    npm install
    ```
3.  **Setup Database**:
    - Buat sebuah database baru di MySQL (contoh: `bookingDB`).
    - Impor file `init.sql` yang telah disediakan ke dalam database tersebut untuk membuat semua tabel dan data awal.
4.  **Konfigurasi Environment**:
    - Salin file `.env.example` menjadi `.env`.
    - Buka file `.env` dan isi variabel berikut sesuai dengan konfigurasi lokal Anda:
      ```
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=password_mysql_anda
      DB_DATABASE=bookingDB
      JWT_SECRET=rahasia_yang_sangat_aman
      ```
5.  **Jalankan Server Backend**:
    ```bash
    npm start
    ```
    Server akan berjalan di `http://localhost:8080`.

### 2. Frontend Setup (`booking-fe`)

1.  **Buka Terminal Baru** dan navigasi ke folder frontend:
    ```bash
    cd booking-fe
    ```
2.  **Instalasi Dependensi**:
    ```bash
    npm install
    ```
3.  **Konfigurasi Environment**:
    - Buat file baru bernama `.env.local`.
    - Isi file tersebut dengan URL backend Anda:
      ```
      JWT_SECRET=JCIu7hBLIz52gbjABnNXn1ZYPUikFqB1VnufWnN9RVoyNIE2R5rRNKZQoLGM4Af2
      ```
4.  **Jalankan Server Frontend**:
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:3000`.

### Akun Demo

Anda bisa menggunakan akun berikut yang sudah tersedia setelah mengimpor `bookingDB.sql`:

- **Admin**:
  - Email: `admin@admin.com`
  - Password: `admin123`
- **User Biasa**:
  - Email: `andi@gmail.com`
  - Password: `admin123`
- **User Biasa**:
  - Email: `prawira@gmail.com`
  - Password: `admin123 / 12345678`

---
