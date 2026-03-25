const db = require('../config/db');
const { generateWorkoutPlan } = require("../engines/workoutEngine");
/*
LOG EXERCISE COMPLETION
*/
exports.logWorkout = async (req, res) => {
  try {
    const { exercise_id, duration_minutes } = req.body;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO workout_logs
       (user_id, exercise_id, duration_minutes)
       VALUES ($1, $2, $3)`,
      [userId, exercise_id, duration_minutes]
    );

    await db.query(
      `INSERT INTO user_points (user_id, points)
       VALUES ($1, 10)
       ON CONFLICT (user_id)
       DO UPDATE SET points = user_points.points + 10`,
      [userId]
    );

    res.json({
      message: "Workout logged"
    });
  } catch (err) {
    console.error("logWorkout error:", err);
    res.status(500).json({ error: "Failed to log workout" });
  }
};


/*
GET WORKOUT HISTORY + STREAKS
*/
exports.getWorkoutHistory = async (req, res) => {

  try {

    const logs = await db.query(
      `SELECT wl.*, e.name
       FROM workout_logs wl
       JOIN exercises e ON e.id = wl.exercise_id
       WHERE wl.user_id=$1
       ORDER BY wl.completed_at DESC`,
      [req.user.id]
    );

    const days = await db.query(
      `SELECT DISTINCT DATE(completed_at) AS workout_date
       FROM workout_logs
       WHERE user_id=$1
       ORDER BY workout_date ASC`,
      [req.user.id]
    );

    const dates = days.rows.map(d => new Date(d.workout_date));

    let current = 0;
    let longest = 0;
    let prev = null;

    dates.forEach(date => {

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
    res.status(500).json({ error: "Server error" });
  }
};



/*
SUBMIT WORKOUT DIFFICULTY RATING
This is the key AI feedback loop
*/
exports.submitWorkoutRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const rating = Number(req.body.rating);
    const day = Number(req.body.day);
    const today = new Date().toISOString().split("T")[0];

    if (isNaN(rating) || isNaN(day)) {
      return res.status(400).json({ error: "Invalid rating or day" });
    }

    const userResult = await db.query(
      `SELECT unlocked_day FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const unlockedDay = userResult.rows[0]?.unlocked_day;

    if (day !== unlockedDay) {
      return res.status(400).json({ error: "This workout day is not currently unlocked" });
    }

    const todayCompletion = await db.query(
      `SELECT id
       FROM daily_workout_completions
       WHERE user_id = $1
         AND completed_date = $2`,
      [userId, today]
    );

    if (todayCompletion.rows.length > 0) {
      return res.status(400).json({
        error: "You already completed today's assigned workout. Extra workouts still earn points, but the next day unlocks tomorrow."
      });
    }

    await db.query(
      `INSERT INTO daily_workout_completions
       (user_id, workout_day, completed_date, rating)
       VALUES ($1, $2, $3, $4)`,
      [userId, day, today, rating]
    );

    await db.query(
      `UPDATE users
       SET unlocked_day = unlocked_day + 1
       WHERE id = $1`,
      [userId]
    );

    const newPlan = await generateWorkoutPlan(userId);

    res.json({
      message: "Workout day completed",
      plan: newPlan
    });
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ error: "Failed to save rating" });
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
        l => new Date(l.day).toLocaleDateString('en-CA') === dateString
      );

      days.push({
        day: dateString,
        workouts: found ? Number(found.workouts) : 0
      });
    }

    res.json(days);
  } catch (err) {
    console.error("Weekly activity error:", err);
    res.status(500).json({
      error: "Failed to fetch weekly activity"
    });
  }
};
/*
GET USER DASHBOARD STATS
(streak, total points, weekly goal progress)
*/
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

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

    const dates = streakDays.rows.map(d => new Date(d.completed_date));

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
      weeklyGoal: 4
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};