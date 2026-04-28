const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');

const {
  logWorkout,
  getWorkoutHistory,
  getUserStats,
  submitWorkoutRating,
  getWeeklyActivity,
  getBonusWorkoutPack,
  swapAssignedExercise,
  swapBonusExercise
} = require('../controllers/workoutController');

router.get('/stats', authenticate, getUserStats);
router.get('/weekly-activity', authenticate, getWeeklyActivity);
router.get('/bonus-pack', authenticate, getBonusWorkoutPack);

router.post('/log', authenticate, logWorkout);
router.get('/history', authenticate, getWorkoutHistory);
router.post('/workout-rating', authenticate, submitWorkoutRating);

router.post('/swap', authenticate, swapAssignedExercise);
router.post('/bonus-pack/swap', authenticate, swapBonusExercise);

module.exports = router;