const db = require('../config/db');

const saveManyToMany = async (client, table, column, userId, values = []) => {

  // Clear old values
  await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);

  if (!values.length) return;

  // Insert new values
  await client.query(
    `INSERT INTO ${table} (user_id, ${column})
     SELECT $1, UNNEST($2::int[])
     ON CONFLICT DO NOTHING`,
    [userId, values]
  );
};

exports.createProfile = async (req, res) => {

  const client = await db.connect();

  try {

    const {
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability,
      injuries = [],
      allergies = [],
      healthConditions = [],
      dietaryRestrictions = []
    } = req.body;

    await client.query('BEGIN');

    // Create profile
    await client.query(`
      INSERT INTO user_profiles
      (user_id, age, height, weight, goal, level, intensity, weekly_availability)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (user_id) DO NOTHING
    `, [
      req.user.id,
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability
    ]);

    // Save relational data
    await saveManyToMany(client, "user_injuries", "injury_id", req.user.id, injuries);
    await saveManyToMany(client, "user_allergies", "allergy_id", req.user.id, allergies);
    await saveManyToMany(client, "user_health_conditions", "condition_id", req.user.id, healthConditions);
    await saveManyToMany(client, "user_dietary_restrictions", "restriction_id", req.user.id, dietaryRestrictions);

    await client.query('COMMIT');

    res.json({ message: "Profile created" });

  } catch (err) {

    console.error(err);
    await client.query('ROLLBACK');

    res.status(500).json({ message: "Profile creation failed" });

  } finally {

    client.release();

  }
};

exports.updateProfile = async (req, res) => {

  const client = await db.connect();

  try {

    const {
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability,
      injuries = [],
      allergies = [],
      healthConditions = [],
      dietaryRestrictions = []
    } = req.body;

    await client.query('BEGIN');

    // Update profile
    await client.query(`
      UPDATE user_profiles
      SET age=$1,
          height=$2,
          weight=$3,
          goal=$4,
          level=$5,
          intensity=$6,
          weekly_availability=$7,
          profile_change_version = profile_change_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id=$8
    `, [
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability,
      req.user.id
    ]);

    // Delete generated plans if profile changes
    await client.query(
      `DELETE FROM generated_plans WHERE user_id=$1`,
      [req.user.id]
    );

    // Update relational data
    await saveManyToMany(client, "user_injuries", "injury_id", req.user.id, injuries);
    await saveManyToMany(client, "user_allergies", "allergy_id", req.user.id, allergies);
    await saveManyToMany(client, "user_health_conditions", "condition_id", req.user.id, healthConditions);
    await saveManyToMany(client, "user_dietary_restrictions", "restriction_id", req.user.id, dietaryRestrictions);

    await client.query('COMMIT');

    res.json({ message: "Profile updated and plans reset" });

  } catch (err) {

    console.error(err);
    await client.query('ROLLBACK');

    res.status(500).json({ message: "Profile update failed" });

  } finally {

    client.release();

  }
};

exports.getProfile = async (req, res) => {

  const userId = req.user.id;

  const result = await db.query(`
    SELECT up.*,

      ARRAY(
        SELECT injury_id
        FROM user_injuries
        WHERE user_id = $1
      ) AS injuries,

      ARRAY(
        SELECT allergy_id
        FROM user_allergies
        WHERE user_id = $1
      ) AS allergies,

      ARRAY(
        SELECT condition_id
        FROM user_health_conditions
        WHERE user_id = $1
      ) AS health_conditions,

      ARRAY(
        SELECT restriction_id
        FROM user_dietary_restrictions
        WHERE user_id = $1
      ) AS dietary_restrictions

    FROM user_profiles up
    WHERE up.user_id = $1
  `, [userId]);

  res.json(result.rows[0] || null);
};