const db = require('../config/db');


// ==============================
// USER INJURIES
// ==============================

exports.saveUserInjuries = async (req, res) => {
  const { injuries } = req.body;
  const userId = req.user.id;

  try {

    await db.query(
      'DELETE FROM user_injuries WHERE user_id = $1',
      [userId]
    );

    for (const injuryId of injuries) {
      await db.query(
        `INSERT INTO user_injuries (user_id, injury_id)
         VALUES ($1,$2)`,
        [userId, injuryId]
      );
    }

    res.json({ message: "User injuries saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save injuries" });
  }
};


exports.getUserInjuries = async (req, res) => {
  try {

    const result = await db.query(
      `SELECT injury_id AS id
       FROM user_injuries
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch injuries" });
  }
};



// ==============================
// USER HEALTH CONDITIONS
// ==============================

exports.saveHealthConditions = async (req, res) => {
  const { conditions } = req.body;
  const userId = req.user.id;

  try {

    await db.query(
      'DELETE FROM user_health_conditions WHERE user_id=$1',
      [userId]
    );

    for (const conditionId of conditions) {
      await db.query(
        `INSERT INTO user_health_conditions (user_id, condition_id)
         VALUES ($1,$2)`,
        [userId, conditionId]
      );
    }

    res.json({ message: "Health conditions saved" });

  } catch (err) {
    res.status(500).json({ error: "Failed to save conditions" });
  }
};


exports.getUserHealthConditions = async (req, res) => {

  try {

    const result = await db.query(
      `SELECT condition_id AS id
       FROM user_health_conditions
       WHERE user_id=$1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conditions" });
  }
};



// ==============================
// USER ALLERGIES
// ==============================

exports.saveAllergies = async (req, res) => {
  const { allergies } = req.body;
  const userId = req.user.id;

  try {

    await db.query(
      'DELETE FROM user_allergies WHERE user_id=$1',
      [userId]
    );

    for (const allergyId of allergies) {
      await db.query(
        `INSERT INTO user_allergies (user_id, allergy_id)
         VALUES ($1,$2)`,
        [userId, allergyId]
      );
    }

    res.json({ message: "Allergies saved" });

  } catch (err) {
    res.status(500).json({ error: "Failed to save allergies" });
  }
};


exports.getUserAllergies = async (req, res) => {

  try {

    const result = await db.query(
      `SELECT allergy_id AS id
       FROM user_allergies
       WHERE user_id=$1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch allergies" });
  }
};



// ==============================
// USER DIETARY RESTRICTIONS
// ==============================

exports.saveDietaryRestrictions = async (req, res) => {
  const { restrictions } = req.body;
  const userId = req.user.id;

  try {

    await db.query(
      'DELETE FROM user_dietary_restrictions WHERE user_id=$1',
      [userId]
    );

    for (const restrictionId of restrictions) {
      await db.query(
        `INSERT INTO user_dietary_restrictions (user_id, restriction_id)
         VALUES ($1,$2)`,
        [userId, restrictionId]
      );
    }

    res.json({ message: "Dietary restrictions saved" });

  } catch (err) {
    res.status(500).json({ error: "Failed to save restrictions" });
  }
};


exports.getUserDietaryRestrictions = async (req, res) => {

  try {

    const result = await db.query(
      `SELECT restriction_id AS id
       FROM user_dietary_restrictions
       WHERE user_id=$1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch restrictions" });
  }
};