const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  logWorkout,
  getWorkoutHistory
} = require('../controllers/workoutController');

router.post('/log', authenticate, logWorkout);
router.get('/history', authenticate, getWorkoutHistory);

module.exports = router;
