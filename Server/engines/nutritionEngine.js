const db = require('../config/db');
const { buildMealSchedule } = require('../services/planUtils');

async function generateMealPlan(userId) {

  const profileResult = await db.query(
    'SELECT goal FROM user_profiles WHERE user_id=$1',
    [userId]
  );

  if (!profileResult.rows.length)
    throw new Error("Profile not found");

  const profile = profileResult.rows[0];

  const meals = await db.query(`
    SELECT m.*
    FROM meals m
    WHERE NOT EXISTS (
      SELECT 1 FROM meal_allergens ma
      JOIN user_allergies ua ON ua.allergy_id = ma.allergy_id
      WHERE ma.meal_id = m.id AND ua.user_id = $1
    )
    AND NOT EXISTS (
      SELECT 1 FROM meal_dietary_tags mdt
      JOIN user_dietary_restrictions udr
      ON udr.restriction_id = mdt.restriction_id
      WHERE mdt.meal_id = m.id AND udr.user_id = $1
    )
  `, [userId]);

  return buildMealSchedule(
    meals.rows,
    profile.goal
  );
}

module.exports = { generateMealPlan };
