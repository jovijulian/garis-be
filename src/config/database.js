const { Model } = require('objection');
const knex = require('knex');
const config = require('../config/knexfile');

const knexConnection = knex(config.development);

Model.knex(knexConnection);

console.log('Objection.js configured with Knex.');

module.exports = { Model, knexConnection };