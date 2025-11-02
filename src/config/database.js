const { Model } = require('objection');
const knex = require('knex');
const config = require('./knexfile');

const knexBooking = knex(config.booking_prod);
const knexHr = knex(config.hr_prod);

class BaseModelBooking extends Model {}
BaseModelBooking.knex(knexBooking);

class BaseModelHr extends Model {}
BaseModelHr.knex(knexHr);

module.exports = {
  knexBooking,
  knexHr,
  BaseModelBooking,
  BaseModelHr,
};