const db = require('../config/db');
const { generateWorkoutPlan } = require('../engines/workoutEngine');
const { generateMealPlan } = require('../engines/nutritionEngine');

exports.getWorkoutPlan = async (req, res) => {
  try {
    const profile = await db.query(
      'SELECT profile_change_version FROM user_profiles WHERE user_id=$1',
      [req.user.id]
    );

    if (!profile.rows.length)
      return res.status(400).json({ message: "Profile not found" });

    const version = profile.rows[0].profile_change_version;

    const existing = await db.query(
      `SELECT content FROM generated_plans
       WHERE user_id=$1 AND plan_type='workout'
       AND profile_version=$2`,
      [req.user.id, version]
    );

    if (existing.rows.length)
      return res.json(existing.rows[0].content);

    const plan = await generateWorkoutPlan(req.user.id);

    await db.query(
      `INSERT INTO generated_plans
       (user_id, plan_type, content, profile_version)
       VALUES ($1,'workout',$2,$3)`,
      [req.user.id, plan, version]
    );

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Workout plan generation failed" });
  }
};

exports.getMealPlan = async (req, res) => {
  try {
    const profile = await db.query(
      'SELECT profile_change_version FROM user_profiles WHERE user_id=$1',
      [req.user.id]
    );

    if (!profile.rows.length)
      return res.status(400).json({ message: "Profile not found" });

    const version = profile.rows[0].profile_change_version;

    const existing = await db.query(
      `SELECT content FROM generated_plans
       WHERE user_id=$1 AND plan_type='meal'
       AND profile_version=$2`,
      [req.user.id, version]
    );

    if (existing.rows.length)
      return res.json(existing.rows[0].content);

    const plan = await generateMealPlan(req.user.id);

    await db.query(
      `INSERT INTO generated_plans
       (user_id, plan_type, content, profile_version)
       VALUES ($1,'meal',$2,$3)`,
      [req.user.id, plan, version]
    );

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Meal plan generation failed" });
  }
};
