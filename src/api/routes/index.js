const express = require('express');
const router = express.Router();

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const roomRoutes = require('./room.route');
const bookingRoutes = require('./booking.route');

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;