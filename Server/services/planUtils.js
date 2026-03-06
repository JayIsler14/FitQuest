function buildWorkoutSchedule(exercises, availability) {
    const map = { '1-2': 2, '3-4': 4, '5-6': 6, '7': 7 };
    const days = map[availability] || 3;

    return {
        days_per_week: days,
        exercises: exercises.slice(0, days * 3)
    };
}

function buildMealSchedule(meals, goal) {
    let filtered = meals;

    if (goal === 'loss') filtered = meals.filter(m => m.calories < 550);
    if (goal === 'gain') filtered = meals.filter(m => m.calories > 500);

    return {
        goal,
        meals: filtered.slice(0, 5)
    };
}

module.exports = {
    buildWorkoutSchedule,
    buildMealSchedule
};
