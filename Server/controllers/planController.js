const db = require('../config/db');
const { generateWorkoutPlan } = require('../engines/workoutEngine');
const { generateMealPlan } = require('../engines/nutritionEngine');


exports.getWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db.query(
      `SELECT unlocked_day FROM users WHERE id = $1`,
      [userId]
    );

    const unlockedDay = user.rows[0].unlocked_day || 1;

    const profile = await db.query(
      `SELECT profile_change_version
       FROM user_profiles
       WHERE user_id = $1`,
      [userId]
    );

    if (!profile.rows.length) {
      return res.status(400).json({ message: "Profile not found" });
    }

    const version = profile.rows[0].profile_change_version;

    const existing = await db.query(
      `SELECT content
       FROM generated_plans
       WHERE user_id = $1
       AND plan_type = 'workout'
       AND profile_version = $2`,
      [userId, version]
    );

    let plan;

    if (existing.rows.length) {
      plan = existing.rows[0].content;
    } else {
      plan = await generateWorkoutPlan(userId);

      await db.query(
        `INSERT INTO generated_plans
         (user_id, plan_type, content, profile_version)
         VALUES ($1, 'workout', $2, $3)`,
        [userId, plan, version]
      );
    }

    const filteredExercises = plan.exercises.filter(
      d => d.day <= unlockedDay
    );

    const today = new Date().toISOString().split("T")[0];

    const todayCompletion = await db.query(
      `
      SELECT workout_day
      FROM daily_workout_completions
      WHERE user_id = $1
      AND completed_date = $2
      LIMIT 1
      `,
      [userId, today]
    );

    const completedToday = todayCompletion.rows.length > 0;

    res.json({
      ...plan,
      exercises: filteredExercises,
      unlockedDay,
      completedToday,
      completedWorkoutDayToday: todayCompletion.rows[0]?.workout_day ?? null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Workout plan generation failed" });
  }
};



exports.generateWorkoutPlanNow = async (req, res) => {
  try {

    const userId = req.user.id;

    const profile = await db.query(
      `SELECT profile_change_version
       FROM user_profiles
       WHERE user_id=$1`,
      [userId]
    );

    const version = profile.rows[0].profile_change_version;

    const plan = await generateWorkoutPlan(userId);

    await db.query(
      `DELETE FROM generated_plans
       WHERE user_id=$1
       AND plan_type='workout'`,
      [userId]
    );

    await db.query(
      `INSERT INTO generated_plans
       (user_id, plan_type, content, profile_version)
       VALUES ($1,'workout',$2,$3)`,
      [userId, plan, version]
    );

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Plan regeneration failed" });
  }
};



exports.getMealPlan = async (req, res) => {
  try {

    const userId = req.user.id;

    const profile = await db.query(
      `SELECT profile_change_version
       FROM user_profiles
       WHERE user_id=$1`,
      [userId]
    );

    if (!profile.rows.length)
      return res.status(400).json({ message: "Profile not found" });

    const version = profile.rows[0].profile_change_version;

    const existing = await db.query(
      `SELECT content
       FROM generated_plans
       WHERE user_id=$1
       AND plan_type='meal'
       AND profile_version=$2`,
      [userId, version]
    );

    if (existing.rows.length)
      return res.json(existing.rows[0].content);

    const plan = await generateMealPlan(userId);

    await db.query(
      `INSERT INTO generated_plans
       (user_id, plan_type, content, profile_version)
       VALUES ($1,'meal',$2,$3)`,
      [userId, plan, version]
    );

    res.json(plan);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Meal plan generation failed" });
  }
};