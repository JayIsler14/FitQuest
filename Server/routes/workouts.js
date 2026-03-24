const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const { submitWorkoutRating } = require('../controllers/workoutController');
const {
  logWorkout,
  getWorkoutHistory,
  getStats
} = require("../controllers/workoutController");

router.get("/stats", authenticate, getStats);

router.post('/log', authenticate, logWorkout);
router.get('/history', authenticate, getWorkoutHistory);
router.post('/workout-rating', authenticate, submitWorkoutRating);
module.exports = router;
