const db = require('../config/db');
const { generateWorkoutPlan } = require('../engines/workoutEngine');

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getDaysPerWeekFromAvailability(availability) {
  if (availability === '1-2') return 2;
  if (availability === '3-4') return 4;
  if (availability === '5-6') return 6;
  if (availability === '7') return 7;

  const parsed = Number(availability);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;

  return 4;
}

async function getUserProfileBasics(userId) {
  const profileResult = await db.query(
    `
    SELECT intensity, profile_change_version
    FROM user_profiles
    WHERE user_id = $1
    `,
    [userId]
  );

  if (!profileResult.rows.length) {
    return null;
  }

  return {
    intensity: Number(profileResult.rows[0].intensity || 1),
    profileVersion: Number(profileResult.rows[0].profile_change_version || 1)
  };
}

async function getSafeReplacementExercise({
  userId,
  intensity,
  currentExerciseId,
  excludeExerciseIds = [],
  preferredMuscleGroup = null
}) {
  const cleanedExcludeIds = Array.isArray(excludeExerciseIds)
    ? excludeExerciseIds
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id) && id !== Number(currentExerciseId))
    : [];

  const sameMuscleGroupResult = await db.query(
    `
    SELECT e.*
    FROM exercises e
    WHERE e.id != $1
      AND e.difficulty <= $2
      AND ($3::text IS NULL OR e.muscle_group = $3)
      AND NOT (e.id = ANY($4::int[]))
      AND NOT EXISTS (
        SELECT 1
        FROM exercise_contraindications ec
        JOIN user_injuries ui ON ui.injury_id = ec.injury_id
        WHERE ec.exercise_id = e.id
          AND ui.user_id = $5
      )
      AND NOT EXISTS (
        SELECT 1
        FROM condition_exercise_restrictions cer
        JOIN user_health_conditions uhc ON uhc.condition_id = cer.condition_id
        WHERE cer.exercise_id = e.id
          AND uhc.user_id = $5
      )
    ORDER BY RANDOM()
    LIMIT 1
    `,
    [
      Number(currentExerciseId),
      intensity,
      preferredMuscleGroup || null,
      cleanedExcludeIds,
      userId
    ]
  );

  if (sameMuscleGroupResult.rows[0]) {
    return sameMuscleGroupResult.rows[0];
  }

  const fallbackResult = await db.query(
    `
    SELECT e.*
    FROM exercises e
    WHERE e.id != $1
      AND e.difficulty <= $2
      AND NOT (e.id = ANY($3::int[]))
      AND NOT EXISTS (
        SELECT 1
        FROM exercise_contraindications ec
        JOIN user_injuries ui ON ui.injury_id = ec.injury_id
        WHERE ec.exercise_id = e.id
          AND ui.user_id = $4
      )
      AND NOT EXISTS (
        SELECT 1
        FROM condition_exercise_restrictions cer
        JOIN user_health_conditions uhc ON uhc.condition_id = cer.condition_id
        WHERE cer.exercise_id = e.id
          AND uhc.user_id = $4
      )
    ORDER BY RANDOM()
    LIMIT 1
    `,
    [Number(currentExerciseId), intensity, cleanedExcludeIds, userId]
  );

  return fallbackResult.rows[0] || null;
}

exports.logWorkout = async (req, res) => {
  try {
    const { exercise_id, duration_minutes } = req.body;
    const userId = req.user.id;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    await db.query(
      `
      INSERT INTO workout_logs
        (user_id, exercise_id, duration_minutes)
      VALUES
        ($1, $2, $3)
      `,
      [userId, exercise_id, duration_minutes || 0]
    );

    await db.query(
      `
      INSERT INTO user_points (user_id, points)
      VALUES ($1, 10)
      ON CONFLICT (user_id)
      DO UPDATE SET points = user_points.points + 10
      `,
      [userId]
    );

    res.json({
      message: 'Workout logged'
    });
  } catch (err) {
    console.error('logWorkout error:', err);
    res.status(500).json({ error: 'Failed to log workout' });
  }
};

exports.getWorkoutHistory = async (req, res) => {
  try {
    const logs = await db.query(
      `
      SELECT wl.*, e.name
      FROM workout_logs wl
      JOIN exercises e ON e.id = wl.exercise_id
      WHERE wl.user_id = $1
      ORDER BY wl.completed_at DESC
      `,
      [req.user.id]
    );

    const days = await db.query(
      `
      SELECT DISTINCT DATE(completed_at) AS workout_date
      FROM workout_logs
      WHERE user_id = $1
      ORDER BY workout_date ASC
      `,
      [req.user.id]
    );

    const dates = days.rows.map((d) => new Date(d.workout_date));

    let current = 0;
    let longest = 0;
    let prev = null;

    dates.forEach((date) => {
      if (!prev) {
        current = 1;
      } else {
        const diff = (date - prev) / (1000 * 60 * 60 * 24);

        if (diff === 1) current += 1;
        else if (diff > 1) current = 1;
      }

      longest = Math.max(longest, current);
      prev = date;
    });

    res.json({
      logs: logs.rows,
      streaks: {
        current,
        longest
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitWorkoutRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const rating = Number(req.body.rating);
    const day = Number(req.body.day);
    const today = new Date().toISOString().split('T')[0];

    if (Number.isNaN(rating) || Number.isNaN(day)) {
      return res.status(400).json({ error: 'Invalid rating or day' });
    }

    const userResult = await db.query(
      `
      SELECT unlocked_day
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const unlockedDay = userResult.rows[0]?.unlocked_day;

    if (day !== unlockedDay) {
      return res.status(400).json({
        error: 'This workout day is not currently unlocked'
      });
    }

    const todayCompletion = await db.query(
      `
      SELECT id
      FROM daily_workout_completions
      WHERE user_id = $1
        AND completed_date = $2
      `,
      [userId, today]
    );

    if (todayCompletion.rows.length > 0) {
      return res.status(400).json({
        error:
          "You already completed today's assigned workout. Extra workouts still earn points, but the next day unlocks tomorrow."
      });
    }

    await db.query(
      `
      INSERT INTO daily_workout_completions
        (user_id, workout_day, completed_date, rating)
      VALUES
        ($1, $2, $3, $4)
      `,
      [userId, day, today, rating]
    );

    await db.query(
      `
      UPDATE users
      SET unlocked_day = unlocked_day + 1
      WHERE id = $1
      `,
      [userId]
    );

    const newPlan = await generateWorkoutPlan(userId);

    res.json({
      message: 'Workout day completed',
      plan: newPlan
    });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ error: 'Failed to save rating' });
  }
};

exports.getWeeklyActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT completed_date AS day,
             COUNT(*) AS workouts
      FROM daily_workout_completions
      WHERE user_id = $1
        AND completed_date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY completed_date
      ORDER BY day
      `,
      [userId]
    );

    const logs = result.rows;
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const dateString = d.toLocaleDateString('en-CA');

      const found = logs.find(
        (l) => new Date(l.day).toLocaleDateString('en-CA') === dateString
      );

      days.push({
        day: dateString,
        workouts: found ? Number(found.workouts) : 0
      });
    }

    res.json(days);
  } catch (err) {
    console.error('Weekly activity error:', err);
    res.status(500).json({
      error: 'Failed to fetch weekly activity'
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await db.query(
      `
      SELECT weekly_availability
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );

    const weeklyAvailability = profileResult.rows[0]?.weekly_availability || '3-4';
    const weeklyGoal = getDaysPerWeekFromAvailability(weeklyAvailability);

    const pointsResult = await db.query(
      `
      SELECT COALESCE(points, 0) AS points
      FROM user_points
      WHERE user_id = $1
      `,
      [userId]
    );

    const weeklyResult = await db.query(
      `
      SELECT COUNT(*) AS completed
      FROM daily_workout_completions
      WHERE user_id = $1
        AND completed_date >= DATE_TRUNC('week', NOW())::date
      `,
      [userId]
    );

    const streakDays = await db.query(
      `
      SELECT completed_date
      FROM daily_workout_completions
      WHERE user_id = $1
      ORDER BY completed_date DESC
      `,
      [userId]
    );

    const dates = streakDays.rows.map((d) => new Date(d.completed_date));

    let streak = 0;
    let prev = null;

    for (const date of dates) {
      if (!prev) {
        streak = 1;
      } else {
        const diff = (prev - date) / (1000 * 60 * 60 * 24);

        if (diff === 1) streak += 1;
        else break;
      }

      prev = date;
    }

    const points = pointsResult.rows.length
      ? Number(pointsResult.rows[0].points)
      : 0;

    res.json({
      streak,
      points,
      weeklyCompleted: Number(weeklyResult.rows[0].completed),
      weeklyGoal,
      weeklyAvailability
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

exports.getBonusWorkoutPack = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await db.query(
      `
      SELECT intensity
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const intensity = Number(profileResult.rows[0].intensity || 1);

    const exercisesResult = await db.query(
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
      [intensity, userId]
    );

    const allExercises = exercisesResult.rows;

    if (allExercises.length < 3) {
      return res.status(400).json({ error: 'Not enough exercises available' });
    }

    const shuffled = shuffle(allExercises);
    const selected = shuffled.slice(0, 3);

    res.json({
      type: 'bonus',
      exercises: selected
    });
  } catch (err) {
    console.error('getBonusWorkoutPack error:', err);
    res.status(500).json({ error: 'Failed to load bonus workouts' });
  }
};

exports.swapAssignedExercise = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentExerciseId = Number(req.body.currentExerciseId);
    const excludeExerciseIds = Array.isArray(req.body.excludeExerciseIds)
      ? req.body.excludeExerciseIds
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];
    const workoutDay = Number(req.body.workoutDay);
    const slotIndex = Number(req.body.slotIndex);

    if (Number.isNaN(currentExerciseId)) {
      return res.status(400).json({ error: 'currentExerciseId is required' });
    }

    if (Number.isNaN(workoutDay)) {
      return res.status(400).json({ error: 'workoutDay is required' });
    }

    if (Number.isNaN(slotIndex)) {
      return res.status(400).json({ error: 'slotIndex is required' });
    }

    const profile = await getUserProfileBasics(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { intensity, profileVersion } = profile;

    const planResult = await db.query(
      `
      SELECT id, content
      FROM generated_plans
      WHERE user_id = $1
        AND plan_type = 'workout'
        AND profile_version = $2
      LIMIT 1
      `,
      [userId, profileVersion]
    );

    if (!planResult.rows.length) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    const generatedPlanId = Number(planResult.rows[0].id);
    const workoutPlan = planResult.rows[0].content || {};

    const requestedDay = (workoutPlan.exercises || []).find(
      (day) => Number(day.day) === workoutDay
    );

    if (!requestedDay) {
      return res.status(404).json({ error: 'Workout day not found in plan' });
    }

    if (slotIndex < 0 || slotIndex >= (requestedDay.exercises || []).length) {
      return res.status(400).json({ error: 'Invalid slot index' });
    }

    const currentExerciseResult = await db.query(
      `
      SELECT id, name, difficulty, muscle_group
      FROM exercises
      WHERE id = $1
      LIMIT 1
      `,
      [currentExerciseId]
    );

    if (!currentExerciseResult.rows.length) {
      return res.status(404).json({ error: 'Current exercise not found' });
    }

    const currentExercise = currentExerciseResult.rows[0];

    const replacement = await getSafeReplacementExercise({
      userId,
      intensity,
      currentExerciseId,
      excludeExerciseIds,
      preferredMuscleGroup: currentExercise.muscle_group || null
    });

    if (!replacement) {
      return res.status(400).json({
        error: 'No safe replacement exercise was found'
      });
    }

    await db.query(
      `
      INSERT INTO user_workout_swaps
        (
          user_id,
          generated_plan_id,
          workout_day,
          slot_index,
          original_exercise_id,
          swapped_exercise_id,
          updated_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, generated_plan_id, workout_day, slot_index)
      DO UPDATE SET
        swapped_exercise_id = EXCLUDED.swapped_exercise_id,
        updated_at = NOW()
      `,
      [
        userId,
        generatedPlanId,
        workoutDay,
        slotIndex,
        currentExerciseId,
        replacement.id
      ]
    );

    res.json({
      message: 'Exercise swapped',
      generatedPlanId,
      workoutDay,
      slotIndex,
      exercise: replacement
    });
  } catch (err) {
    console.error('swapAssignedExercise error:', err);
    res.status(500).json({ error: 'Failed to swap exercise' });
  }
};

exports.swapBonusExercise = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentExerciseId = Number(req.body.currentExerciseId);
    const excludeExerciseIds = Array.isArray(req.body.excludeExerciseIds)
      ? req.body.excludeExerciseIds
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

    if (Number.isNaN(currentExerciseId)) {
      return res.status(400).json({ error: 'currentExerciseId is required' });
    }

    const profile = await getUserProfileBasics(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { intensity } = profile;

    const currentExerciseResult = await db.query(
      `
      SELECT id, name, difficulty, muscle_group
      FROM exercises
      WHERE id = $1
      LIMIT 1
      `,
      [currentExerciseId]
    );

    if (!currentExerciseResult.rows.length) {
      return res.status(404).json({ error: 'Current exercise not found' });
    }

    const currentExercise = currentExerciseResult.rows[0];

    const replacement = await getSafeReplacementExercise({
      userId,
      intensity,
      currentExerciseId,
      excludeExerciseIds,
      preferredMuscleGroup: currentExercise.muscle_group || null
    });

    if (!replacement) {
      return res.status(400).json({
        error: 'No safe replacement exercise was found'
      });
    }

    res.json({
      message: 'Bonus exercise swapped',
      exercise: replacement
    });
  } catch (err) {
    console.error('swapBonusExercise error:', err);
    res.status(500).json({ error: 'Failed to swap bonus exercise' });
  }
};