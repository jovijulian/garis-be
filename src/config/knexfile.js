require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL, 
    pool: { min: 2, max: 10 }
  },

  production: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 }
  }
};