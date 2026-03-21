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
  console.log("User Profile:", profile);


  // Get average workout rating
  const ratingResult = await db.query(`
  SELECT AVG(rating) as avg_rating
  FROM (
    SELECT rating
    FROM workout_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  ) recent
`, [userId]);

  let adjustedIntensity = profile.intensity;

  const avgRating = ratingResult.rows[0].avg_rating;

  if (avgRating !== null) {
    if (avgRating >= 4) adjustedIntensity += 1;
    if (avgRating <= 2) adjustedIntensity -= 1;
  }

  // Clamp difficulty
  adjustedIntensity = Math.max(1, Math.min(5, adjustedIntensity));

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
  `, [adjustedIntensity, userId]);
  console.log("Exercises returned:", exercises.rows.length);

  return buildWorkoutSchedule(
    exercises.rows,
    profile.weekly_availability,
    3
  );
}

module.exports = { generateWorkoutPlan };