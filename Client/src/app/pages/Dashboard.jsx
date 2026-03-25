import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../services/api";
import { Dumbbell, UtensilsCrossed, TrendingUp, Calendar, User } from 'lucide-react';
import { getWorkout, getMealPlan, getUserStats, getWorkoutHistory, getWeeklyActivity } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [stats, setStats] = useState({ streak: 0, points: 0 });
  const [loading, setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [results,setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {

      const [workoutRes, mealRes, statsRes, historyRes] = await Promise.all([
        getWorkout(),
        getMealPlan(),
        getUserStats(),
        getWorkoutHistory()
      ]);

      setPlan({
        workout: workoutRes.data,
        meals: mealRes.data
      });

      setStats(statsRes.data);

      setCompletedExercises(historyRes.data.logs || []);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    console.log("SEARCH CLICKED", search);

    if (!search.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      const res = await api.get(`/social/search?q=${encodeURIComponent(search)}`);
      console.log("Search results:", res.data);
      
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setSearched(true);
    }
  };

  const loadWeeklyActivity = async () => {
    try {

      const res = await getWeeklyActivity();

      const formatted = res.data.map(d => ({
        day: new Date(d.day).toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: Number(d.workouts)
      }));

      setWeeklyActivity(formatted);

    } catch (error) {
      console.error('Failed to load activity:', error);
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

  // 🔹 Flatten exercises across all days
  const allExercises =
    plan?.workout?.exercises?.flatMap(day => day.exercises) || [];

  // 🔹 Show only first 3 exercises
  const nextExercises = allExercises.slice(0, 3);
  const todayExercises =
    plan?.workout?.exercises?.find(
      d => d.day === plan?.workout?.unlockedDay
    )?.exercises || [];

  const todayExerciseIds = todayExercises.map(ex => ex.id);

  const completedToday = completedExercises.filter(log => {
    const logDate = new Date(log.completed_at).toDateString();
    const today = new Date().toDateString();

    return (
      logDate === today &&
      log.exercise_id !== null &&
      todayExerciseIds.includes(log.exercise_id)
    );
  }).length;

  const totalToday = todayExercises.length;



  const progressPercent =
    totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-gray-600">Here's your personalized fitness plan for today</p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          <User size={18} />
          <span className="font-medium">Account</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">

        <input
          type="text"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search users..."
          className="border p-2 rounded w-full"
        />

        <button
          onClick={searchUsers}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
        Search
        </button>

      </div>

        {results.length > 0 && (
          <div className="mb-6">
          {results.map(user => (
            <div
              key={user.id}
              className="bg-white p-4 rounded shadow mb-2 hover:shadow-lg transition"
            >
              <h3 className="font-bold">{user.username}</h3>
              <p>{user.goal || 'No goal set'}</p>
              <p>🔥 {user.streak} day streak</p>
              <p>🏆 {user.points} points</p>

              <button
                onClick={() => navigate(`/profile/${user.id}`)}
                className="mt-2 bg-gray-800 text-white px-3 py-1 rounded"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="mb-6 bg-white p-4 rounded shadow text-gray-600">
          No users found.
        </div>
      )}

        
      {/* Stats */}
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
          <p className="text-4xl font-bold">
            {stats.weeklyCompleted}/{stats.weeklyGoal}
          </p>
          <p className="text-green-100">workouts completed</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Workout Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Dumbbell className="text-blue-600" size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Today's Workout
              </h2>

              <p className="text-sm text-gray-600">
                {completedToday} / {totalToday} exercises completed
              </p>
            </div>

          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-5">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-3 mb-4">

            {nextExercises.map((exercise, index) => (

              <div
                key={exercise.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >

                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {exercise.name}
                  </p>

                  <p className="text-sm text-gray-600">
                    {exercise.muscle_group} • Difficulty {exercise.difficulty}
                  </p>
                </div>

              </div>

            ))}

          </div>

          <button
            onClick={() => navigate('/workout')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Workout
          </button>

        </div>

        {/* Meal Plan */}
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

                <div
                  key={mealType}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >

                  <div>
                    <p className="font-medium text-gray-800 capitalize">
                      {mealType}
                    </p>

                    <p className="text-sm text-gray-600">
                      {meal.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {meal.calories}
                    </p>

                    <p className="text-xs text-gray-600">
                      cal
                    </p>
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

      {/* Weekly Activity */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Weekly Activity
        </h2>

        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
          <p>Activity chart will be displayed here</p>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;