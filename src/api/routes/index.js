const express = require('express');
const router = express.Router();

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const roomRoutes = require('./room.route');
const bookingRoutes = require('./booking.route');
const userAccessRoutes = require('./user-access.route');
const amenityRoutes = require('./amenity.route')
const topicRoutes = require('./topic.route')
const dashboardRoutes = require('./dashboard.route');
const consumptionTypeRoutes = require('./consumption-type.route')
const orderRoutes = require('./order.route');

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/user-access', userAccessRoutes);
router.use('/amenities', amenityRoutes);
router.use('/topics', topicRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/consumption-types', consumptionTypeRoutes);
router.use('/orders', orderRoutes);

module.exports = router;