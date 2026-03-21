// Shuffle helper
function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

/**
 * Build a weekly workout plan
 * @param {Array} exercises - filtered exercises from DB
 * @param {String} availability - weekly availability like '3-4'
 * @param {Number} exercisesPerDay - optional, default 3
 * @returns {Object}
 */
function buildWorkoutSchedule(exercises, availability, exercisesPerDay = 3) {
  let days;

  if (availability === '1-2') days = 2;
  else if (availability === '3-4') days = 4;
  else if (availability === '5-6') days = 6;
  else if (availability === '7') days = 7;
  else if (!isNaN(availability)) days = Number(availability);
  else days = 3;

  const shuffled = shuffle([...exercises]);
  const plan = [];

  for (let day = 0; day < days; day++) {
    const startIndex = day * exercisesPerDay;
    const endIndex = startIndex + exercisesPerDay;

    // If not enough exercises, pick remaining without duplicates
    const dailyExercises = shuffled.slice(startIndex, endIndex);

    if (dailyExercises.length === 0) {
      dailyExercises.push(shuffled[day % shuffled.length]);
    }

    plan.push({
      day: day + 1,
      exercises: dailyExercises
    });
  }

  return { days_per_week: days, exercises: plan };
}

/**
 * Build a daily meal plan
 * @param {Array} meals - filtered meals from DB
 * @param {String} goal - 'loss', 'gain', etc.
 * @param {Number} mealsPerDay - optional, default 3
 * @returns {Object}
 */
function buildMealSchedule(meals, goal, mealsPerDay = 3) {
  let filtered = [...meals];

  if (goal === 'loss') filtered = filtered.filter(m => m.calories < 550);
  if (goal === 'gain') filtered = filtered.filter(m => m.calories > 500);

  const shuffled = shuffle(filtered);
  const dailyMeals = shuffled.slice(0, mealsPerDay);

  return { goal, meals: dailyMeals };
}

module.exports = { buildWorkoutSchedule, buildMealSchedule };