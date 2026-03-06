const db = require('../config/db');

exports.createProfile = async (req, res) => {
  const client = await db.connect();
  try {
    const {
      age, height, weight, goal,
      level, intensity, weeklyAvailability,
      injuries = [], allergies = [],
      healthConditions = [], dietaryRestrictions = []
    } = req.body;

    await client.query('BEGIN');

    await client.query(`
      INSERT INTO user_profiles
      (user_id, age, height, weight, goal, level, intensity, weekly_availability)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [req.user.id, age, height, weight, goal, level, intensity, weeklyAvailability]);

    await client.query('COMMIT');
    res.json({ message: "Profile created" });

  } catch {
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
      age, height, weight, goal,
      level, intensity, weeklyAvailability
    } = req.body;

    await client.query('BEGIN');

    await client.query(`
      UPDATE user_profiles
      SET age=$1, height=$2, weight=$3,
          goal=$4, level=$5, intensity=$6,
          weekly_availability=$7,
          profile_change_version = profile_change_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id=$8
    `, [age, height, weight, goal, level, intensity, weeklyAvailability, req.user.id]);

    await client.query(`DELETE FROM generated_plans WHERE user_id=$1`, [req.user.id]);

    await client.query('COMMIT');
    res.json({ message: "Profile updated and plans reset" });

  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ message: "Profile update failed" });
  } finally {
    client.release();
  }
};

exports.getProfile = async (req, res) => {
  const result = await db.query(
    'SELECT * FROM user_profiles WHERE user_id=$1',
    [req.user.id]
  );
  res.json(result.rows[0] || null);
};
