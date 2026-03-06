const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  logMeal,
  getMealHistory
} = require('../controllers/mealController');

router.post('/log', authenticate, logMeal);
router.get('/history', authenticate, getMealHistory);

module.exports = router;
