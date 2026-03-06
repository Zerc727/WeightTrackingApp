const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');

router.use(auth);
router.get('/exercise/:exerciseId', ctrl.exerciseProgress);

module.exports = router;
