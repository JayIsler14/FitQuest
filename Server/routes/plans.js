const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getWorkoutPlan,
  getMealPlan
} = require('../controllers/planController');

router.get('/workout', authenticate, getWorkoutPlan);
router.get('/meal', authenticate, getMealPlan);

module.exports = router;
