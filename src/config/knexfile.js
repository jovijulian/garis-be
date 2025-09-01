require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL, // <-- CUKUP SATU BARIS INI
    pool: { min: 2, max: 10 }
  },

  // SANGAT DISARANKAN: Tambahkan juga environment untuk production
  production: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL, // <-- Variabel yang sama
    pool: { min: 2, max: 10 }
  }
};