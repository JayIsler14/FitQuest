import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, TrendingUp, Calendar, User } from 'lucide-react';
import { generateFullPlan, getUserStats } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [stats, setStats] = useState({ streak: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // TODO: GET /generateFullPlan
      // Backend:
      // - Check profile_change_version
      // - Regenerate plans if outdated
      // AI runs in:
      // - workoutEngine.js
      // - mealEngine.js
      // Plans stored in generated_plans table
      const [planResponse, statsResponse] = await Promise.all([
        generateFullPlan(),
        getUserStats(),
      ]);

      setPlan(planResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Account Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-gray-600">Here's your personalized fitness plan for today</p>
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => navigate('/profile')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            <User size={18} />
            <span className="font-medium">Account</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Current Streak</h3>
            <Calendar size={24} />
          </div>
          <p className="text-4xl font-bold">{stats.streak}</p>
          <p className="text-orange-100">days in a row</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Total Points</h3>
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-bold">{stats.points}</p>
          <p className="text-blue-100">earned so far</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Weekly Goal</h3>
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-bold">3/4</p>
          <p className="text-green-100">workouts completed</p>
        </div>
      </div>

      {/* AI LOGIC IS SERVER-SIDE */}
      {/* workoutEngine.js handles safety filtering */}
      {/* difficultyEngine.js adapts difficulty */}
      {/* nutritionEngine.js calculates BMR & macro targets */}
      {/* Plans regenerate if profile_change_version changes */}
      {/* Never generate static plans client-side */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Workout Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Dumbbell className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Today's Workout</h2>
              <p className="text-sm text-gray-600">
                {plan?.workout?.exercises?.length || 0} exercises planned
              </p>
            </div>
          </div>

          {plan?.workout?.exercises && (
            <div className="space-y-3 mb-4">
              {plan.workout.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{exercise.name}</p>
                    <p className="text-sm text-gray-600">{exercise.muscleGroup}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/workout')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Workout
          </button>
        </div>

        {/* Today's Meal Plan Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Today's Meal Plan</h2>
              <p className="text-sm text-gray-600">Personalized nutrition</p>
            </div>
          </div>

          {plan?.meals && (
            <div className="space-y-3 mb-4">
              {Object.entries(plan.meals).map(([mealType, meal]) => (
                <div key={mealType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 capitalize">{mealType}</p>
                    <p className="text-sm text-gray-600">{meal.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{meal.calories}</p>
                    <p className="text-xs text-gray-600">cal</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/meal-plan')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            View Full Plan
          </button>
        </div>
      </div>

      {/* Weekly Summary Graph Placeholder */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Activity</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
          <p>Activity chart will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;