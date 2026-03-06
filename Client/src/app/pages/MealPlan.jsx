import React, { useState, useEffect } from 'react';
import BackToDashboard from '../components/BackToDashboard';
import MealCard from '../components/MealCard';
import { getMealPlan } from '../services/api';

const MealPlan = () => {
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      // TODO: GET /meal-plan
      // Backend AI:
      // - Remove allergens
      // - Filter dietary compatibility
      // - Calculate BMR using Mifflin-St Jeor
      // - Adjust by goal
      // Uses meals table
      const response = await getMealPlan();
      setMeals(response.data);
    } catch (error) {
      console.error('Failed to load meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  const totalCalories = meals
    ? Object.values(meals).reduce((sum, meal) => sum + meal.calories, 0)
    : 0;

  const totalProtein = meals
    ? Object.values(meals).reduce((sum, meal) => sum + meal.protein, 0)
    : 0;

  const totalCarbs = meals
    ? Object.values(meals).reduce((sum, meal) => sum + meal.carbs, 0)
    : 0;

  const totalFat = meals
    ? Object.values(meals).reduce((sum, meal) => sum + meal.fat, 0)
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Today's Meal Plan</h1>
        <p className="text-gray-600">AI-personalized nutrition based on your goals and preferences</p>
      </div>

      {/* AI LOGIC IS SERVER-SIDE */}
      {/* nutritionEngine.js calculates BMR & macro targets */}
      {/* Plans regenerate if profile_change_version changes */}

      {/* Daily summary */}
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

      {/* Meal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meals && Object.entries(meals).map(([mealType, meal]) => (
          <MealCard key={mealType} meal={meal} mealType={mealType} />
        ))}
      </div>

      {/* Info card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 About Your Plan</h3>
        <p className="text-blue-800">
          This meal plan is personalized based on your fitness goals, dietary restrictions, and allergies.
          All meals are calculated using the Mifflin-St Jeor equation to meet your caloric needs.
        </p>
      </div>
    </div>
  );
};

export default MealPlan;