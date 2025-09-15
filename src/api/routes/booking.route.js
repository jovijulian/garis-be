const express = require('express');
const router = express.Router();

const BookingController = require('../controllers/booking.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    bookingIdSchema
} = require('../../validations/booking.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), BookingController.createBooking);
router.get('/', BookingController.getAll);
router.get('/user', BookingController.getAllBookingUser);
router.get('/check-availability', BookingController.checkAvailability);
router.get('/:id', validate(bookingIdSchema), BookingController.detail);
router.put('/:id', validate(updateSchema), BookingController.update);
router.put('/user/:id', validate(updateSchema), BookingController.updateUser);
router.delete('/:id', validate(bookingIdSchema), BookingController.delete);
router.put('/status/:id', validate(bookingIdSchema), BookingController.updateBookingStatus);

module.exports = router;