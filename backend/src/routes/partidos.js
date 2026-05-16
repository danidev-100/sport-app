const express = require('express');
const partidoController = require('../controllers/partidoController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(authorize('ADMIN'));

router.get('/', partidoController.getAll);
router.get('/:id', partidoController.getById);
router.post('/', partidoController.create);
router.put('/:id', partidoController.update);
router.delete('/:id', partidoController.remove);

module.exports = router;
