const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');

const {
  logWorkout,
  getWorkoutHistory,
  getUserStats,
  submitWorkoutRating
} = require("../controllers/workoutController");

router.get("/stats", authenticate, getUserStats);

router.post('/log', authenticate, logWorkout);
router.get('/history', authenticate, getWorkoutHistory);
router.post('/workout-rating', authenticate, submitWorkoutRating);
module.exports = router;
