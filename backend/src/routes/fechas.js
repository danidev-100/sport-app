const express = require('express');
const fechaController = require('../controllers/fechaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/', fechaController.getAll);
router.get('/:id', fechaController.getById);
router.post('/', fechaController.create);
router.put('/:id', fechaController.update);
router.delete('/:id', fechaController.remove);

module.exports = router;
