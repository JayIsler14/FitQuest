const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');

const {
  saveUserInjuries,
  getUserInjuries,
  saveHealthConditions,
  getUserHealthConditions,
  saveAllergies,
  getUserAllergies,
  saveDietaryRestrictions,
  getUserDietaryRestrictions
} = require('../controllers/userHealthController');


// Injuries
router.post('/user-injuries', authenticate, saveUserInjuries);
router.get('/user-injuries', authenticate, getUserInjuries);


// Health Conditions
router.post('/user-health-conditions', authenticate, saveHealthConditions);
router.get('/user-health-conditions', authenticate, getUserHealthConditions);


// Allergies
router.post('/user-allergies', authenticate, saveAllergies);
router.get('/user-allergies', authenticate, getUserAllergies);


// Dietary Restrictions
router.post('/user-dietary-restrictions', authenticate, saveDietaryRestrictions);
router.get('/user-dietary-restrictions', authenticate, getUserDietaryRestrictions);


module.exports = router;