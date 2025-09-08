require('dotenv').config();
module.exports = {
  booking: {
    client: process.env.DB_CLIENT,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: { min: 2, max: 10 }
  },

  hr: {
    client: process.env.DB_SECOND_CLIENT,
    connection: {
      host: process.env.DB_SECOND_HOST,
      user: process.env.DB_SECOND_USER,
      password: process.env.DB_SECOND_PASSWORD,
      database: process.env.DB_SECOND_NAME,
    },
    pool: { min: 2, max: 10 }
  },
};