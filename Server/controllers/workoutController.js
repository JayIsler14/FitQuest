const db = require('../config/db');

exports.logWorkout = async (req, res) => {
  const { exercise_id, duration_minutes } = req.body;

  await db.query(
    `INSERT INTO workout_logs (user_id, exercise_id, duration_minutes)
     VALUES ($1,$2,$3)`,
    [req.user.id, exercise_id, duration_minutes]
  );

  res.json({ message: "Workout logged" });
};

exports.getWorkoutHistory = async (req, res) => {
  const result = await db.query(
    `SELECT wl.*, e.name
     FROM workout_logs wl
     JOIN exercises e ON e.id = wl.exercise_id
     WHERE wl.user_id=$1
     ORDER BY wl.completed_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
};
