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

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/user-access', userAccessRoutes);
router.use('/amenities', amenityRoutes);
router.use('/topics', topicRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;