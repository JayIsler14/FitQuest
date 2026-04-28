const db = require('../config/db');

const getTodayDateString = () => {
  return new Date().toISOString().slice(0, 10);
};

exports.logMeal = async (req, res) => {
  try {
    const { meal_id } = req.body;

    if (!meal_id) {
      return res.status(400).json({ error: 'meal_id is required' });
    }

    await db.query(
      `INSERT INTO food_logs (user_id, meal_id)
       VALUES ($1, $2)`,
      [req.user.id, meal_id]
    );

    res.json({ message: 'Meal logged' });
  } catch (err) {
    console.error('logMeal error:', err);
    res.status(500).json({ error: 'Failed to log meal' });
  }
};

exports.getMealHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT fl.*, m.name
       FROM food_logs fl
       JOIN meals m ON m.id = fl.meal_id
       WHERE fl.user_id = $1
       ORDER BY fl.logged_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getMealHistory error:', err);
    res.status(500).json({ error: 'Failed to load meal history' });
  }
};

exports.swapMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealId, slotIndex } = req.body;

    if (mealId == null) {
      return res.status(400).json({ error: 'mealId is required' });
    }

    if (slotIndex == null) {
      return res.status(400).json({ error: 'slotIndex is required' });
    }

    const today = getTodayDateString();

    const currentMealResult = await db.query(
      `SELECT *
       FROM meals
       WHERE id = $1
       LIMIT 1`,
      [mealId]
    );

    if (currentMealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Current meal not found' });
    }

    const currentMeal = currentMealResult.rows[0];

    const swapResult = await db.query(
      `SELECT m.*
       FROM meals m
       WHERE m.id <> $1
       ORDER BY RANDOM()
       LIMIT 1`,
      [mealId]
    );

    if (swapResult.rows.length === 0) {
      return res.status(404).json({ error: 'No replacement meal found' });
    }

    const swappedMeal = swapResult.rows[0];

    await db.query(
      `INSERT INTO user_meal_swaps (
         user_id,
         meal_date,
         slot_index,
         original_meal_id,
         swapped_meal_id
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, meal_date, slot_index)
       DO UPDATE SET
         original_meal_id = EXCLUDED.original_meal_id,
         swapped_meal_id = EXCLUDED.swapped_meal_id,
         updated_at = NOW()`,
      [userId, today, Number(slotIndex), currentMeal.id, swappedMeal.id]
    );

    res.json(swappedMeal);
  } catch (err) {
    console.error('swapMeal error:', err);
    res.status(500).json({ error: 'Failed to swap meal' });
  }
};