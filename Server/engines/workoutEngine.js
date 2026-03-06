const db = require('../config/db');
const { buildWorkoutSchedule } = require('../services/planUtils');

async function generateWorkoutPlan(userId) {

  const profileResult = await db.query(
    'SELECT intensity, weekly_availability FROM user_profiles WHERE user_id=$1',
    [userId]
  );

  if (!profileResult.rows.length)
    throw new Error("Profile not found");

  const profile = profileResult.rows[0];

  const exercises = await db.query(`
    SELECT e.*
    FROM exercises e
    WHERE e.difficulty <= $1
    AND NOT EXISTS (
      SELECT 1 FROM exercise_contraindications ec
      JOIN user_injuries ui ON ui.injury_id = ec.injury_id
      WHERE ec.exercise_id = e.id AND ui.user_id = $2
    )
    AND NOT EXISTS (
      SELECT 1 FROM condition_exercise_restrictions cer
      JOIN user_health_conditions uhc ON uhc.condition_id = cer.condition_id
      WHERE cer.exercise_id = e.id AND uhc.user_id = $2
    )
  `, [profile.intensity, userId]);

  return buildWorkoutSchedule(
    exercises.rows,
    profile.weekly_availability
  );
}

module.exports = { generateWorkoutPlan };
