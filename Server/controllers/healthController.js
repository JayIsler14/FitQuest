const db = require('../config/db');

// GET /api/injuries
exports.getInjuries = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name FROM injuries ORDER BY name'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch injuries' });
  }
};


// GET /api/health-conditions
exports.getHealthConditions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name FROM health_conditions ORDER BY name'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch health conditions' });
  }
};


// GET /api/allergies
exports.getAllergies = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name FROM allergies ORDER BY name'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
};


// GET /api/dietary-restrictions
exports.getDietaryRestrictions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name FROM dietary_restrictions ORDER BY name'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dietary restrictions' });
  }
};