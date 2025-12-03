require('dotenv').config();
module.exports = {
  booking: {
    client: process.env.DB_DEV_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_DEV_HOST,
      user: process.env.DB_DEV_USER,
      password: process.env.DB_DEV_PASSWORD,
      database: process.env.DB_DEV_NAME,
      port: 3306
    },
    pool: { min: 2, max: 10 }
  },

  booking_prod: {
    client: process.env.DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306
    },
    pool: { min: 2, max: 10 }
  },

  hr: {
    client: process.env.DB_SECOND_DEV_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_SECOND_DEV_HOST,
      user: process.env.DB_SECOND_DEV_USER,
      password: process.env.DB_SECOND_DEV_PASSWORD,
      database: process.env.DB_SECOND_DEV_NAME,
      port: 3306
    },
    pool: { min: 2, max: 10 }
  },

  hr_prod: {
    client: process.env.DB_SECOND_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_SECOND_HOST,
      user: process.env.DB_SECOND_USER,
      password: process.env.DB_SECOND_PASSWORD,
      database: process.env.DB_SECOND_NAME,
      port: 3307
    },
    pool: { min: 2, max: 10 }
  },
};