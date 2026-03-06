const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/workoutsController');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

router.post('/:id/exercises', ctrl.addExercise);
router.put('/:id/exercises/:weId', ctrl.updateExercise);
router.delete('/:id/exercises/:weId', ctrl.removeExercise);

router.post('/:id/exercises/:weId/sets', ctrl.addSet);
router.put('/:id/exercises/:weId/sets/:setId', ctrl.updateSet);
router.delete('/:id/exercises/:weId/sets/:setId', ctrl.deleteSet);

module.exports = router;
