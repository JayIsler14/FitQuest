const db = require('../config/db');

exports.logMeal = async (req, res) => {
  const { meal_id } = req.body;

  await db.query(
    `INSERT INTO food_logs (user_id, meal_id)
     VALUES ($1,$2)`,
    [req.user.id, meal_id]
  );

  res.json({ message: "Meal logged" });
};

exports.getMealHistory = async (req, res) => {
  const result = await db.query(
    `SELECT fl.*, m.name
     FROM food_logs fl
     JOIN meals m ON m.id = fl.meal_id
     WHERE fl.user_id=$1
     ORDER BY fl.logged_at DESC`,
    [req.user.id]
  );

  res.json(result.rows);
};
