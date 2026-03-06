const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createProfile,
  updateProfile,
  getProfile
} = require('../controllers/onboardingController');

router.post('/', authenticate, createProfile);
router.put('/', authenticate, updateProfile);
router.get('/', authenticate, getProfile);

module.exports = router;
