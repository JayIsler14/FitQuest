const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');

const {
  logMeal,
  getMealHistory,
  swapMeal
} = require('../controllers/mealController');

router.post('/log', authenticate, logMeal);
router.get('/history', authenticate, getMealHistory);
router.post('/swap', authenticate, swapMeal);

module.exports = router;
