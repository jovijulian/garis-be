const express = require('express');
const router = express.Router();

const AmenityController = require('../controllers/amenity.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    amenityIdSchema
} = require('../../validations/amenity.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), AmenityController.create);
router.get('/', AmenityController.getAll);
router.get('/options', AmenityController.options);
router.get('/:id', validate(amenityIdSchema), AmenityController.detail);
router.put('/:id', validate(updateSchema), AmenityController.update);
router.delete('/:id', validate(amenityIdSchema), AmenityController.delete);

module.exports = router;