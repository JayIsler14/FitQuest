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
       VALUES ($1,$2,$3)`,
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

exports.getStats = async (req, res) => {

  try {

    const result = await db.query(
      `SELECT streak
       FROM user_streaks
       WHERE user_id=$1`,
      [req.user.id]
    );

    res.json({
      streak: result.rows[0]?.streak || 0
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });

  }

};
