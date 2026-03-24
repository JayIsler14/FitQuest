const db = require('../config/db');
const { generateWorkoutPlan } = require("../engines/workoutEngine");
/*
LOG EXERCISE COMPLETION
*/
exports.logWorkout = async (req, res) => {

  const { exercise_id, duration_minutes } = req.body;
  const userId = req.user.id;

  await db.query(
    `INSERT INTO workout_logs
     (user_id, exercise_id, duration_minutes)
     VALUES ($1,$2,$3)`,
    [userId, exercise_id, duration_minutes]
  );

  await db.query(
    `INSERT INTO user_points (user_id, points)
    VALUES ($1,10)
    ON CONFLICT (user_id)
    DO UPDATE SET points = user_points.points + 10`,
    [userId]
  );

  await db.query(
    `UPDATE user_points
    SET points = points + 10
    WHERE user_id=$1`,
    [userId]
  );

  const today = new Date().toISOString().split("T")[0];

  const streakResult = await db.query(
    `SELECT streak, last_workout_date
     FROM user_streaks
     WHERE user_id=$1`,
    [userId]
  );

  let newStreak = 1;

  if (streakResult.rows.length) {

    const { streak, last_workout_date } = streakResult.rows[0];

    const lastDate = last_workout_date
      ? new Date(last_workout_date).toISOString().split("T")[0]
      : null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastDate === today) {
      newStreak = streak;
    }

    else if (lastDate === yesterdayStr) {
      newStreak = streak + 1;
    }

    else {
      newStreak = 1;
    }

    await db.query(
      `UPDATE user_streaks
       SET streak=$1,
           last_workout_date=$2
       WHERE user_id=$3`,
      [newStreak, today, userId]
    );

  } else {

    await db.query(
      `INSERT INTO user_streaks (user_id, streak, last_workout_date)
       VALUES ($1,1,$2)`,
      [userId, today]
    );

  }

  res.json({
    message: "Workout logged",
    streak: newStreak
  });

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

  console.log("Rating request body:", req.body);

  const userId = req.user.id;
  const rating = parseInt(req.body.rating);
  const day = parseInt(req.body.day);

  try {

    if (isNaN(rating) || isNaN(day)) {
      return res.status(400).json({ error: "Invalid rating or day" });
    }

    await db.query(
      `INSERT INTO workout_logs (user_id, rating, day)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, day)
      DO UPDATE SET rating = EXCLUDED.rating`,
      [userId, rating, day]
    );

    await db.query(
      `UPDATE users
       SET unlocked_day = GREATEST(unlocked_day, $1 + 1)
       WHERE id = $2`,
      [day, userId]
    );

    const newPlan = await generateWorkoutPlan(userId);

    res.json({
      message: "Rating saved",
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
      SELECT (completed_at AT TIME ZONE 'America/New_York')::date AS day,
          COUNT(*) AS workouts
      FROM workout_logs
      WHERE user_id = $1
      AND rating IS NOT NULL
      AND completed_at >= NOW() - INTERVAL '7 days'
      GROUP BY (completed_at AT TIME ZONE 'America/New_York')::date
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

    // TOTAL POINTS
    const pointsResult = await db.query(
      `
      SELECT COALESCE(SUM(points_earned),0) AS points
      FROM workout_logs
      WHERE user_id = $1
      `,
      [userId]
    );

    // WEEKLY COMPLETED WORKOUTS
    const weeklyResult = await db.query(
      `
      SELECT COUNT(*) AS completed
      FROM workout_logs
      WHERE user_id = $1
      AND completed_at >= DATE_TRUNC('week', NOW())
      `,
      [userId]
    );

    // CURRENT STREAK
    const streakDays = await db.query(
      `
      SELECT DISTINCT (completed_at AT TIME ZONE 'America/New_York')::date AS day
      FROM workout_logs
      WHERE user_id = $1
      AND exercise_id IS NOT NULL
      ORDER BY day DESC
      `,
      [userId]
    );

    const dates = streakDays.rows.map(d => new Date(d.day));

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

    res.json({
      streak,
      points: Number(pointsResult.rows[0].points),
      weeklyCompleted: Number(weeklyResult.rows[0].completed),
      weeklyGoal: 4
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });

  }

};
