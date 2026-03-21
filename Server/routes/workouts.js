const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');

const {
  logWorkout,
  getWorkoutHistory,
  submitWorkoutRating,
  getWeeklyActivity
} = require('../controllers/workoutController');
const { getUserStats } = require('../controllers/workoutController');
const workoutController = require("../controllers/workoutController");
router.get('/stats', authenticate, getUserStats);
router.post('/log', authenticate, logWorkout);

router.get('/history', authenticate, getWorkoutHistory);
router.get("/completed-today", authenticate, workoutController.getTodayCompletedExercises);
router.post('/workout-rating', authenticate, submitWorkoutRating);

router.get('/weekly-activity', authenticate, getWeeklyActivity);

module.exports = router;