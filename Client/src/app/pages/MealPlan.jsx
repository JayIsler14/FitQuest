import React, { useState, useEffect } from 'react';
import BackToDashboard from '../components/BackToDashboard';
import MealCard from '../components/MealCard';
import api, { getMealPlan } from '../services/api';

const MealPlan = () => {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      const response = await getMealPlan();
      console.log('MEAL PLAN RESPONSE:', response.data);
      console.log('FIRST DAY:', response.data?.days?.[0]);
      setMealPlan(response.data);
    } catch (error) {
      console.error('Failed to load meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDay = mealPlan?.days?.[0] || null;
  const meals = currentDay?.meals || [];

  const handleSwap = async (mealId, mealIndex) => {
    try {
      const res = await api.post('/meals/swap', { mealId });

      if (!res.data) return;

      setMealPlan((prev) => {
        if (!prev?.days?.length) return prev;

        const updatedDays = [...prev.days];
        const firstDay = updatedDays[0];

        if (!firstDay?.meals) return prev;

        updatedDays[0] = {
          ...firstDay,
          meals: firstDay.meals.map((meal, index) =>
            index === mealIndex ? res.data : meal
          )
        };

        return {
          ...prev,
          days: updatedDays
        };
      });
    } catch (err) {
      console.error('Swap failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + Number(meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + Number(meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + Number(meal.fat || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackToDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Today&apos;s Meal Plan</h1>
        <p className="text-gray-600">
          AI-personalized nutrition based on your goals and preferences
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Nutrition Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{totalCalories}</p>
            <p className="text-gray-600">Total Calories</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalProtein}g</p>
            <p className="text-gray-600">Protein</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{totalCarbs}g</p>
            <p className="text-gray-600">Carbs</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{totalFat}g</p>
            <p className="text-gray-600">Fat</p>
          </div>
        </div>
      </div>

      {meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meals.map((meal, index) => (
            <MealCard
              key={meal.id || index}
              meal={meal}
              mealType={meal.meal_type || ['Breakfast', 'Lunch', 'Dinner'][index] || 'Meal'}
              onSwap={() => handleSwap(meal.id, index)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <p className="text-yellow-800">No meals were returned from the API.</p>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 About Your Plan</h3>
        <p className="text-blue-800">
          This meal plan is personalized based on your fitness goals, dietary
          restrictions, and allergies. All meals are calculated to match your
          nutrition targets.
        </p>
      </div>
    </div>
  );
};

export default MealPlan;
