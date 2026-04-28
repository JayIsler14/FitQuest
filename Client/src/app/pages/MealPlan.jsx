import React, { useEffect, useMemo, useState } from 'react';
import BackToDashboard from '../components/BackToDashboard';
import MealCard from '../components/MealCard';
import api, { getMealPlan, getMealHistory, logMeal } from '../services/api';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

const getTodayName = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long' });

const normalizeMeal = (meal) => ({
  ...meal,
  id: meal?.id ?? meal?.meal_id ?? meal?.mealId,
  name: meal?.name ?? meal?.title ?? 'Meal',
  calories: Number(meal?.calories ?? 0),
  protein: Number(meal?.protein ?? 0),
  carbs: Number(meal?.carbs ?? 0),
  fat: Number(meal?.fat ?? 0),
});

const getTodaysMealsFromPlan = (planData) => {
  if (!planData || !Array.isArray(planData.days)) return [];

  const todayName = getTodayName();

  const todayEntry =
    planData.days.find((d) => d?.day === todayName || d?.name === todayName) ||
    planData.days[0];

  if (!todayEntry) return [];

  const rawMeals = Array.isArray(todayEntry.meals) ? todayEntry.meals : [];
  return rawMeals.map(normalizeMeal);
};

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const MealPlan = () => {
  const [mealPlan, setMealPlan] = useState(null);
  const [meals, setMeals] = useState([]);
  const [eatenMealIds, setEatenMealIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busyMealIndex, setBusyMealIndex] = useState(null);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      const [planRes, historyRes] = await Promise.all([
        getMealPlan(),
        getMealHistory(),
      ]);

      const planData = planRes.data || {};
      const apiMeals = getTodaysMealsFromPlan(planData);

      setMealPlan(planData);
      setMeals(apiMeals);

      const historyRows = Array.isArray(historyRes.data) ? historyRes.data : [];
      const eatenIds = new Set(
        historyRows
          .map((row) => row.meal_id ?? row.mealId ?? row.id)
          .filter(Boolean)
      );

      setEatenMealIds(eatenIds);
    } catch (error) {
      console.error('Failed to load meal page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (mealId, mealIndex) => {
    try {
      setBusyMealIndex(mealIndex);

      const res = await api.post('/meals/swap', {
        mealId,
        slotIndex: mealIndex,
      });

      const swappedMeal = normalizeMeal(res.data);

      if (!swappedMeal) return;

      setMeals((prevMeals) =>
        prevMeals.map((meal, index) =>
          index === mealIndex ? swappedMeal : meal
        )
      );
    } catch (err) {
      console.error('Swap failed', err);
    } finally {
      setBusyMealIndex(null);
    }
  };

  const handleMarkAte = async (meal, mealIndex) => {
    try {
      setBusyMealIndex(mealIndex);

      await logMeal({ meal_id: meal.id });

      setEatenMealIds((prev) => {
        const next = new Set(prev);
        next.add(meal.id);
        return next;
      });
    } catch (err) {
      console.error('Mark Ate failed', err);
    } finally {
      setBusyMealIndex(null);
    }
  };

  const handleSearch = (meal) => {
    const query = encodeURIComponent(meal?.name || '');
    window.open(`https://www.google.com/search?q=${query}+recipe`, '_blank');
  };

  const eatenMeals = useMemo(
    () => meals.filter((meal) => eatenMealIds.has(meal.id)),
    [meals, eatenMealIds]
  );

  const consumedCalories = useMemo(
    () => eatenMeals.reduce((sum, meal) => sum + Number(meal?.calories || 0), 0),
    [eatenMeals]
  );

  const consumedProtein = useMemo(
    () => eatenMeals.reduce((sum, meal) => sum + Number(meal?.protein || 0), 0),
    [eatenMeals]
  );

  const consumedCarbs = useMemo(
    () => eatenMeals.reduce((sum, meal) => sum + Number(meal?.carbs || 0), 0),
    [eatenMeals]
  );

  const consumedFat = useMemo(
    () => eatenMeals.reduce((sum, meal) => sum + Number(meal?.fat || 0), 0),
    [eatenMeals]
  );

  const plannedCalories = useMemo(
    () => meals.reduce((sum, meal) => sum + Number(meal?.calories || 0), 0),
    [meals]
  );

  const plannedProtein = useMemo(
    () => meals.reduce((sum, meal) => sum + Number(meal?.protein || 0), 0),
    [meals]
  );

  const plannedCarbs = useMemo(
    () => meals.reduce((sum, meal) => sum + Number(meal?.carbs || 0), 0),
    [meals]
  );

  const plannedFat = useMemo(
    () => meals.reduce((sum, meal) => sum + Number(meal?.fat || 0), 0),
    [meals]
  );

  const calorieGoal =
    Number(mealPlan?.daily_targets?.calories) ||
    Number(mealPlan?.targets?.calories) ||
    2000;

  const proteinGoal =
    Number(mealPlan?.daily_targets?.protein) ||
    Number(mealPlan?.targets?.protein) ||
    150;

  const carbsGoal =
    Number(mealPlan?.daily_targets?.carbs) ||
    Number(mealPlan?.targets?.carbs) ||
    225;

  const fatGoal =
    Number(mealPlan?.daily_targets?.fat) ||
    Number(mealPlan?.targets?.fat) ||
    70;

  const caloriePercent = clampPercent((consumedCalories / calorieGoal) * 100);
  const proteinPercent = clampPercent((consumedProtein / proteinGoal) * 100);
  const carbsPercent = clampPercent((consumedCarbs / carbsGoal) * 100);
  const fatPercent = clampPercent((consumedFat / fatGoal) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 mt-3">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full p-6">
      <div className="w-full">
        <BackToDashboard />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Today&apos;s Meal Plan
          </h1>
          <p className="text-gray-600">
            AI-personalized nutrition based on your goals and preferences
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Daily Nutrition Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{consumedCalories}</p>
              <p className="text-gray-600">Calories</p>
              <p className="text-sm text-gray-500">Goal: {calorieGoal}</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{consumedProtein}g</p>
              <p className="text-gray-600">Protein</p>
              <p className="text-sm text-gray-500">Goal: {proteinGoal}g</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{consumedCarbs}g</p>
              <p className="text-gray-600">Carbs</p>
              <p className="text-sm text-gray-500">Goal: {carbsGoal}g</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{consumedFat}g</p>
              <p className="text-gray-600">Fat</p>
              <p className="text-sm text-gray-500">Goal: {fatGoal}g</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Calories</span>
                <span className="text-sm text-gray-500">
                  {consumedCalories} / {calorieGoal}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gray-800 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Protein</span>
                <span className="text-sm text-gray-500">
                  {consumedProtein}g / {proteinGoal}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Carbs</span>
                <span className="text-sm text-gray-500">
                  {consumedCarbs}g / {carbsGoal}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Fat</span>
                <span className="text-sm text-gray-500">
                  {consumedFat}g / {fatGoal}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Planned</p>
              <p className="text-lg font-semibold text-gray-800">{plannedCalories}</p>
              <p className="text-xs text-gray-500">calories</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Planned</p>
              <p className="text-lg font-semibold text-blue-600">{plannedProtein}g</p>
              <p className="text-xs text-gray-500">protein</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Planned</p>
              <p className="text-lg font-semibold text-orange-600">{plannedCarbs}g</p>
              <p className="text-xs text-gray-500">carbs</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Planned</p>
              <p className="text-lg font-semibold text-green-600">{plannedFat}g</p>
              <p className="text-xs text-gray-500">fat</p>
            </div>
          </div>
        </div>

        {meals.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {meals.map((meal, index) => (
              <MealCard
                key={`meal-slot-${index}`}
                meal={meal}
                mealType={MEAL_TYPES[index] || 'Meal'}
                onSwap={() => handleSwap(meal.id, index)}
                onSearch={() => handleSearch(meal)}
                onMarkAte={() => handleMarkAte(meal, index)}
                isEaten={eatenMealIds.has(meal.id)}
                isLoading={busyMealIndex === index}
              />
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <p className="text-yellow-800">No meals were returned from the API.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlan;