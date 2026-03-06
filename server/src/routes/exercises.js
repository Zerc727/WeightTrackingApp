const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/exercisesController');

router.get('/', auth, ctrl.list);
router.post('/', auth, adminOnly, ctrl.create);
router.delete('/:id', auth, adminOnly, ctrl.remove);

module.exports = router;
