const express = require('express');
const router = express.Router();

const InternController = require('../controllers/intern.controller');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    internIdSchema
    
} = require('../../validations/intern.validation');
const verifyToken = require('../../middlewares/verifyToken');

router.use(verifyToken);

router.post('/', validate(createSchema), InternController.create);
router.get('/', InternController.getAll);
router.get('/options', InternController.options);
router.get('/:id', validate(internIdSchema
    ), InternController.detail);
router.put('/:id', validate(updateSchema), InternController.update);
router.delete('/:id', validate(internIdSchema
    ), InternController.delete);

module.exports = router;