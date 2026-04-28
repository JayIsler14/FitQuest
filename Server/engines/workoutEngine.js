const db = require('../config/db');
const { buildWorkoutSchedule } = require('../services/planUtils');

function rotateDays(days, weekNumber) {
  if (!Array.isArray(days) || days.length === 0) return [];

  const offset = Math.max(0, (weekNumber - 1) % days.length);
  const rotated = [...days.slice(offset), ...days.slice(0, offset)];

  return rotated.map((day, index) => ({
    ...day,
    day: index + 1
  }));
}

async function generateWorkoutPlan(userId, options = {}) {
  const { weekNumber = 1 } = options;

  const profileResult = await db.query(
    `
    SELECT intensity, weekly_availability
    FROM user_profiles
    WHERE user_id = $1
    `,
    [userId]
  );

  if (!profileResult.rows.length) {
    throw new Error('Profile not found');
  }

  const profile = profileResult.rows[0];
  console.log('User Profile:', profile);

  /*
    Only use OFFICIAL assigned-workout ratings for progression.
    Do NOT use workout_logs here, because bonus workouts are also stored there.
  */
  const ratingResult = await db.query(
    `
    SELECT AVG(rating)::numeric AS avg_rating
    FROM (
      SELECT rating
      FROM daily_workout_completions
      WHERE user_id = $1
        AND rating IS NOT NULL
      ORDER BY completed_date DESC
      LIMIT 5
    ) recent
    `,
    [userId]
  );

  let adjustedIntensity = Number(profile.intensity || 1);
  const avgRating = ratingResult.rows[0]?.avg_rating;

  if (avgRating !== null) {
    if (Number(avgRating) >= 4) adjustedIntensity += 1;
    if (Number(avgRating) <= 2) adjustedIntensity -= 1;
  }

  adjustedIntensity = Math.max(1, Math.min(5, adjustedIntensity));

  const exercises = await db.query(
    `
    SELECT e.*
    FROM exercises e
    WHERE e.difficulty <= $1
      AND NOT EXISTS (
        SELECT 1
        FROM exercise_contraindications ec
        JOIN user_injuries ui ON ui.injury_id = ec.injury_id
        WHERE ec.exercise_id = e.id
          AND ui.user_id = $2
      )
      AND NOT EXISTS (
        SELECT 1
        FROM condition_exercise_restrictions cer
        JOIN user_health_conditions uhc ON uhc.condition_id = cer.condition_id
        WHERE cer.exercise_id = e.id
          AND uhc.user_id = $2
      )
    `,
    [adjustedIntensity, userId]
  );

  console.log('Exercises returned:', exercises.rows.length);

  const basePlan = buildWorkoutSchedule(
    exercises.rows,
    profile.weekly_availability,
    3
  );

  return {
    ...basePlan,
    generatedForWeek: weekNumber,
    exercises: rotateDays(basePlan.exercises || [], weekNumber)
  };
}

module.exports = { generateWorkoutPlan };