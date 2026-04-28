const db = require('../config/db');
const { generateWorkoutPlan } = require('../engines/workoutEngine');
const { generateMealPlan } = require('../engines/nutritionEngine');

function getDaysPerWeekFromAvailability(availability) {
  if (availability === '1-2') return 2;
  if (availability === '3-4') return 4;
  if (availability === '5-6') return 6;
  if (availability === '7') return 7;

  const parsed = Number(availability);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;

  return 4;
}

function getWeekAndDayFromCompleted(totalCompleted, daysPerWeek) {
  return {
    currentWeek: Math.floor(totalCompleted / daysPerWeek) + 1,
    unlockedDay: (totalCompleted % daysPerWeek) + 1
  };
}

function getDisplayDayFromWorkoutDay(workoutDay, daysPerWeek) {
  if (!workoutDay || !daysPerWeek) return 1;
  return ((Number(workoutDay) - 1) % daysPerWeek) + 1;
}

function getWeekFromWorkoutDay(workoutDay, daysPerWeek) {
  if (!workoutDay || !daysPerWeek) return 1;
  return Math.floor((Number(workoutDay) - 1) / daysPerWeek) + 1;
}

async function getWorkoutProgress(userId, weeklyAvailability) {
  const daysPerWeek = getDaysPerWeekFromAvailability(weeklyAvailability);

  const result = await db.query(
    `
    SELECT COUNT(*)::int AS completed
    FROM daily_workout_completions
    WHERE user_id = $1
    `,
    [userId]
  );

  const totalCompleted = Number(result.rows[0]?.completed || 0);
  const { currentWeek, unlockedDay } = getWeekAndDayFromCompleted(
    totalCompleted,
    daysPerWeek
  );

  return {
    daysPerWeek,
    totalCompleted,
    currentWeek,
    unlockedDay
  };
}

async function getCompletedToday(userId) {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.query(
    `
    SELECT id, workout_day, completed_date
    FROM daily_workout_completions
    WHERE user_id = $1
      AND completed_date = $2
    LIMIT 1
    `,
    [userId, today]
  );

  return {
    completedToday: result.rows.length > 0,
    completion: result.rows[0] || null
  };
}

async function applySavedWorkoutSwaps(userId, generatedPlanId, workoutPlan) {
  if (!generatedPlanId || !workoutPlan || !Array.isArray(workoutPlan.exercises)) {
    return workoutPlan;
  }

  const swapResult = await db.query(
    `
    SELECT
      uws.workout_day,
      uws.slot_index,
      uws.original_exercise_id,
      uws.swapped_exercise_id,
      e.*
    FROM user_workout_swaps uws
    JOIN exercises e
      ON e.id = uws.swapped_exercise_id
    WHERE uws.user_id = $1
      AND uws.generated_plan_id = $2
    ORDER BY uws.workout_day ASC, uws.slot_index ASC
    `,
    [userId, generatedPlanId]
  );

  if (!swapResult.rows.length) {
    return workoutPlan;
  }

  const nextPlan = {
    ...workoutPlan,
    exercises: (workoutPlan.exercises || []).map((day) => ({
      ...day,
      exercises: Array.isArray(day.exercises) ? [...day.exercises] : []
    }))
  };

  for (const swap of swapResult.rows) {
    const dayIndex = nextPlan.exercises.findIndex(
      (day) => Number(day.day) === Number(swap.workout_day)
    );

    if (dayIndex === -1) continue;

    const slotIndex = Number(swap.slot_index);

    if (
      Number.isNaN(slotIndex) ||
      slotIndex < 0 ||
      slotIndex >= nextPlan.exercises[dayIndex].exercises.length
    ) {
      continue;
    }

    nextPlan.exercises[dayIndex].exercises[slotIndex] = {
      ...swap
    };
  }

  return nextPlan;
}

exports.getWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await db.query(
      `
      SELECT profile_change_version, weekly_availability
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profileVersion = profileResult.rows[0].profile_change_version;
    const weeklyAvailability = profileResult.rows[0].weekly_availability;

    const progress = await getWorkoutProgress(userId, weeklyAvailability);
    const { completedToday, completion } = await getCompletedToday(userId);

    let displayWeek = progress.currentWeek;
    let displayDay = progress.unlockedDay;

    if (completedToday && completion?.workout_day) {
      const completedAbsoluteDay = Number(completion.workout_day);

      displayWeek = getWeekFromWorkoutDay(
        completedAbsoluteDay,
        progress.daysPerWeek
      );

      displayDay = getDisplayDayFromWorkoutDay(
        completedAbsoluteDay,
        progress.daysPerWeek
      );
    }

    const existingPlanResult = await db.query(
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

    let workoutPlan = existingPlanResult.rows[0]?.content || null;
    let existingPlanId = existingPlanResult.rows[0]?.id || null;

    const planHasMissingDescriptions =
      Array.isArray(workoutPlan?.exercises) &&
      workoutPlan.exercises.some((day) =>
        Array.isArray(day.exercises) &&
        day.exercises.some(
          (exercise) =>
            !exercise.exercise_description ||
            exercise.exercise_description.trim() === ''
        )
      );

    const needsNewPlan =
      !workoutPlan ||
      !Array.isArray(workoutPlan.exercises) ||
      workoutPlan.generatedForWeek !== displayWeek ||
      planHasMissingDescriptions;

    if (needsNewPlan) {
      workoutPlan = await generateWorkoutPlan(userId, {
        weekNumber: displayWeek,
        daysPerWeek: progress.daysPerWeek
      });

      const planToSave = {
        ...workoutPlan,
        generatedForWeek: displayWeek
      };

      if (existingPlanId) {
        await db.query(
          `
          UPDATE generated_plans
          SET content = $1
          WHERE id = $2
          `,
          [planToSave, existingPlanId]
        );
      } else {
        const inserted = await db.query(
          `
          INSERT INTO generated_plans
            (user_id, plan_type, content, profile_version)
          VALUES
            ($1, 'workout', $2, $3)
          RETURNING id
          `,
          [userId, planToSave, profileVersion]
        );

        existingPlanId = inserted.rows[0].id;
      }

      workoutPlan = planToSave;
    }

    workoutPlan = await applySavedWorkoutSwaps(
      userId,
      existingPlanId,
      workoutPlan
    );

    const currentWorkoutDay =
      workoutPlan.exercises?.find(
        (day) => Number(day.day) === Number(displayDay)
      ) || null;

    res.json({
      ...workoutPlan,
      generatedPlanId: existingPlanId,
      currentWeek: progress.currentWeek,
      displayWeek,
      unlockedDay: progress.unlockedDay,
      displayDay,
      daysPerWeek: progress.daysPerWeek,
      totalCompleted: progress.totalCompleted,
      completedToday,
      dayCompleted: completedToday,
      assignedCompleted: completedToday,
      currentWorkoutDay
    });
  } catch (err) {
    console.error('getWorkoutPlan error:', err);
    res.status(500).json({ error: 'Failed to load workout plan' });
  }
};

exports.generateWorkoutPlanNow = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await db.query(
      `
      SELECT profile_change_version, weekly_availability
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profileVersion = profileResult.rows[0].profile_change_version;
    const weeklyAvailability = profileResult.rows[0].weekly_availability;

    const progress = await getWorkoutProgress(userId, weeklyAvailability);

    const workoutPlan = await generateWorkoutPlan(userId, {
      weekNumber: progress.currentWeek,
      daysPerWeek: progress.daysPerWeek
    });

    const planToSave = {
      ...workoutPlan,
      generatedForWeek: progress.currentWeek
    };

    const existingPlanResult = await db.query(
      `
      SELECT id
      FROM generated_plans
      WHERE user_id = $1
        AND plan_type = 'workout'
        AND profile_version = $2
      LIMIT 1
      `,
      [userId, profileVersion]
    );

    let savedPlanId = null;

    if (existingPlanResult.rows.length) {
      savedPlanId = existingPlanResult.rows[0].id;

      await db.query(
        `
        UPDATE generated_plans
        SET content = $1
        WHERE id = $2
        `,
        [planToSave, savedPlanId]
      );
    } else {
      const inserted = await db.query(
        `
        INSERT INTO generated_plans
          (user_id, plan_type, content, profile_version)
        VALUES
          ($1, 'workout', $2, $3)
        RETURNING id
        `,
        [userId, planToSave, profileVersion]
      );

      savedPlanId = inserted.rows[0].id;
    }

    res.json({
      message: 'Workout plan generated',
      generatedPlanId: savedPlanId,
      plan: planToSave
    });
  } catch (err) {
    console.error('generateWorkoutPlanNow error:', err);
    res.status(500).json({ error: 'Failed to generate workout plan' });
  }
};

exports.getMealPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileRes = await db.query(
      `
      SELECT profile_change_version
      FROM user_profiles
      WHERE user_id = $1
      `,
      [userId]
    );

    if (!profileRes.rows.length) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const profileVersion = profileRes.rows[0].profile_change_version;

    const existingPlan = await db.query(
      `
      SELECT id, content
      FROM generated_plans
      WHERE user_id = $1
        AND plan_type = 'meal'
        AND profile_version = $2
      LIMIT 1
      `,
      [userId, profileVersion]
    );

    if (existingPlan.rows.length) {
      return res.json(existingPlan.rows[0].content);
    }

    const mealPlan = await generateMealPlan(userId);

    await db.query(
      `
      INSERT INTO generated_plans
        (user_id, plan_type, content, profile_version)
      VALUES
        ($1, 'meal', $2, $3)
      `,
      [userId, mealPlan, profileVersion]
    );

    res.json(mealPlan);
  } catch (err) {
    console.error('getMealPlan error:', err);
    res.status(500).json({ error: 'Failed to load meal plan' });
  }
};