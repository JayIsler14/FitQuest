const router = require('express').Router();

const {
  getInjuries,
  getHealthConditions,
  getAllergies,
  getDietaryRestrictions
} = require('../controllers/healthController');

router.get('/injuries', getInjuries);

router.get('/health-conditions', getHealthConditions);

router.get('/allergies', getAllergies);

router.get('/dietary-restrictions', getDietaryRestrictions);

module.exports = router;