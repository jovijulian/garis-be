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
const upload = require('../../middlewares/upload');

router.use(verifyToken);

router.post('/', validate(createSchema), BookingController.createBooking);
router.get('/', BookingController.getAll);
router.get('/export-excel', BookingController.exportToExcel);
router.get('/user', BookingController.getAllBookingUser);
router.get('/options', BookingController.options);
router.get('/check-availability', BookingController.checkAvailability);
router.get('/:id', validate(bookingIdSchema), BookingController.detail);
router.put('/:id', validate(updateSchema), BookingController.update);
router.put('/user/:id', validate(updateSchema), BookingController.updateUser);
router.delete('/:id', validate(bookingIdSchema), BookingController.delete);
router.put('/status/:id', validate(bookingIdSchema), BookingController.updateBookingStatus);
router.put('/cancel/:id', validate(bookingIdSchema), BookingController.cancelBooking);
router.put('/force-approve/:id', validate(bookingIdSchema), BookingController.forceApproveBooking);
router.post('/upload-proof/:id',upload.single('proofFile'), BookingController.uploadProof);

module.exports = router;