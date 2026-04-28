import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import {
  getWorkout,
  getMealPlan,
  getUserStats,
  getWorkoutHistory,
  getUserProfile
} from '../services/api';
import WeeklyActivity from '../components/WeeklyActivity';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [plan, setPlan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    streak: 0,
    points: 0,
    weeklyCompleted: 0,
    weeklyGoal: 4
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [dayKey, setDayKey] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const getUserKey = () => {
    try {
      return localStorage.getItem('jwt_token') || 'guest';
    } catch {
      return 'guest';
    }
  };

  const assignedCompleteStorageKey = useMemo(
    () => `fitquest_assigned_complete_${getUserKey()}_${dayKey}`,
    [dayKey]
  );

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
      planData.days.find(
        (d) => d?.day === todayName || d?.name === todayName
      ) || planData.days[0];

    if (!todayEntry) return [];

    return Array.isArray(todayEntry.meals)
      ? todayEntry.meals.map(normalizeMeal)
      : [];
  };

  const formatWeeklyAvailability = (value) => {
    if (value === '1-2') return '1-2 days/week';
    if (value === '3-4') return '3-4 days/week';
    if (value === '5-6') return '5-6 days/week';
    if (value === '7') return 'Every day';
    return '3-4 days/week';
  };

  const getDaysPerWeekFromAvailability = (availability) => {
    if (availability === '1-2') return 2;
    if (availability === '3-4') return 4;
    if (availability === '5-6') return 6;
    if (availability === '7') return 7;

    const parsed = Number(availability);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;

    return 4;
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [workoutRes, mealRes, statsRes, historyRes, profileRes] =
        await Promise.all([
          getWorkout(),
          getMealPlan(),
          getUserStats(),
          getWorkoutHistory(),
          getUserProfile()
        ]);

      const workoutData = workoutRes.data || {};
      const mealData = mealRes.data || {};
      const statsData = statsRes.data || {};
      const profileData = profileRes.data || null;
      const todaysMeals = getTodaysMealsFromPlan(mealData);

      setPlan({
        workout: workoutData,
        meals: mealData,
        todaysMeals
      });

      setProfile(profileData);
      setCompletedExercises(historyRes.data?.logs || []);

      const preferredDaysPerWeek =
        workoutData?.daysPerWeek ||
        getDaysPerWeekFromAvailability(profileData?.weeklyAvailability);

      setStats({
        ...statsData,
        weeklyGoal: preferredDaysPerWeek
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, dayKey, location.key]);

  useEffect(() => {
    const handleFocus = () => loadDashboard();
    const handleStatsUpdated = () => loadDashboard();
    const handleProfileUpdated = () => loadDashboard();

    const interval = setInterval(() => {
      const newDayKey = new Date().toISOString().slice(0, 10);
      if (newDayKey !== dayKey) {
        setDayKey(newDayKey);
      }
    }, 30000);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('stats-updated', handleStatsUpdated);
    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('stats-updated', handleStatsUpdated);
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [dayKey, loadDashboard]);

  const searchUsers = async () => {
    if (!search.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      const res = await api.get(`/social/search?q=${encodeURIComponent(search)}`);
      setResults(res.data || []);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setSearched(true);
    }
  };

  const isTodayLog = (log) => {
    const timestamp = log?.completed_at || log?.created_at;
    if (!timestamp) return false;
    return new Date(timestamp).toDateString() === new Date().toDateString();
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

  const workoutPlan = plan?.workout || {};
  const todayMeals = plan?.todaysMeals || [];
  const workoutDays = Array.isArray(workoutPlan?.exercises)
    ? workoutPlan.exercises
    : [];

  const daysPerWeek =
    workoutPlan?.daysPerWeek ||
    getDaysPerWeekFromAvailability(profile?.weeklyAvailability);

  const currentWeek = Number(workoutPlan?.displayWeek || workoutPlan?.currentWeek || 1);

  const selectedDayNumber =
    Number(
      workoutPlan?.currentWorkoutDay?.day ||
      workoutPlan?.displayDay ||
      workoutPlan?.unlockedDay ||
      1
    );

  const assignedDay =
    workoutDays.find((day) => Number(day.day) === selectedDayNumber) ||
    workoutPlan?.currentWorkoutDay ||
    null;

  const currentDayNumber = Math.min(
    Math.max(Number(assignedDay?.day || selectedDayNumber || 1), 1),
    daysPerWeek
  );

  const todayExercises = assignedDay?.exercises || [];
  const todayExerciseIds = todayExercises.map((ex) => ex.id);

  const completedAssignedIds = completedExercises
    .filter((log) => {
      return (
        isTodayLog(log) &&
        log.exercise_id != null &&
        todayExerciseIds.includes(log.exercise_id)
      );
    })
    .map((log) => log.exercise_id);

  const uniqueCompletedAssigned = [...new Set(completedAssignedIds)];

  const localAssignedComplete =
    localStorage.getItem(assignedCompleteStorageKey) === 'true';

  const completedToday =
    (todayExerciseIds.length > 0 &&
      uniqueCompletedAssigned.length === todayExerciseIds.length) ||
    !!workoutPlan?.completedToday ||
    !!workoutPlan?.dayCompleted ||
    !!workoutPlan?.assignedCompleted ||
    localAssignedComplete;

  const completedTodayCount = completedToday
    ? todayExercises.length
    : uniqueCompletedAssigned.length;

  const totalToday = todayExercises.length;

  const progressPercent =
    totalToday > 0 ? (completedTodayCount / totalToday) * 100 : 0;

  const weeklyCompleted = stats.weeklyCompleted || 0;
  const weeklyGoal = daysPerWeek;

  const cardClass =
    'bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full';

  const innerRowClass =
    'flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white transition-all duration-200 hover:border-gray-200 hover:shadow-sm';

  return (
    <div className="w-full p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-gray-600">
            Here&apos;s your personalized fitness plan for today
          </p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 hover:shadow-sm transition-all duration-200"
        >
          <User size={18} />
          <span className="font-medium">Account</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="border border-gray-200 p-2.5 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />

        <button
          onClick={searchUsers}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md transition-all duration-200"
        >
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-6">
          {results.map((user) => (
            <div
              key={user.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="font-bold text-gray-800">{user.username}</h3>
              <p className="text-gray-600">{user.goal || 'No goal set'}</p>
              <p className="text-gray-700">🔥 {user.streak} day streak</p>
              <p className="text-gray-700">🏆 {user.points} points</p>

              <button
                onClick={() => navigate(`/profile/${user.id}`)}
                className="mt-3 bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors duration-200"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-600">
          No users found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Current Streak</h3>
            <Calendar size={24} />
          </div>
          <p className="text-4xl font-bold">{stats.streak || 0}</p>
          <p className="text-orange-100">days in a row</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Total Points</h3>
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-bold">{stats.points || 0}</p>
          <p className="text-blue-100">earned so far</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Weekly Goal</h3>
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-bold">
            {weeklyCompleted}/{weeklyGoal}
          </p>
          <p className="text-green-100">
            Goal based on {formatWeeklyAvailability(profile?.weeklyAvailability)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className={cardClass}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <Dumbbell className="text-blue-600" size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Today&apos;s Workout
                </h2>

                <p className="text-sm text-gray-600">
                  Week {currentWeek} • Day {currentDayNumber} of {daysPerWeek}
                </p>

                <p className="text-sm text-gray-600">
                  Preferred schedule: {formatWeeklyAvailability(profile?.weeklyAvailability)}
                </p>

                <p className="text-sm text-gray-600">
                  {completedTodayCount} / {totalToday} completed
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-3">
              {todayExercises.map((exercise, index) => {
                const isCompleted =
                  completedToday || uniqueCompletedAssigned.includes(exercise.id);

                return (
                  <div key={exercise.id} className={innerRowClass}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white shrink-0 shadow-sm transition-colors duration-200 ${
                        isCompleted ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0 ml-3">
                      <p className="font-medium text-gray-800 truncate">
                        {exercise.name}
                      </p>

                      <p className="text-sm text-gray-600 truncate">
                        {(exercise.muscle_group ||
                          exercise.muscleGroup ||
                          'Workout')}{' '}
                        • Difficulty {exercise.difficulty}
                      </p>
                    </div>
                  </div>
                );
              })}

              {todayExercises.length === 0 && (
                <div className="p-4 bg-gray-50 rounded-xl text-gray-600 border border-gray-100">
                  No workout available for today.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/workout')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg active:scale-[0.99] transition-all duration-200 mt-5"
          >
            {completedToday ? 'View Bonus Workouts' : 'Start Workout'}
          </button>
        </div>

        <div className={cardClass}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                <UtensilsCrossed className="text-green-600" size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Today&apos;s Meal Plan
                </h2>
                <p className="text-sm text-gray-600">Personalized nutrition</p>
              </div>
            </div>

            {todayMeals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.map((meal, index) => {
                  const label =
                    meal.meal_type ||
                    ['Breakfast', 'Lunch', 'Dinner'][index] ||
                    'Meal';

                  return (
                    <div
                      key={`${meal.id || label}-${index}`}
                      className={innerRowClass}
                    >
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                          {label}
                        </p>

                        <p className="font-medium text-gray-800 truncate">
                          {meal.name || 'Unnamed meal'}
                        </p>
                      </div>

                      <div className="text-right ml-4 shrink-0">
                        <p className="font-semibold text-gray-800">
                          {meal.calories || 0}
                        </p>
                        <p className="text-xs text-gray-600">cal</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl text-gray-600 border border-gray-100">
                No meals available for today.
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/meal-plan')}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 hover:shadow-lg active:scale-[0.99] transition-all duration-200 mt-5"
          >
            View Full Plan
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Weekly Activity
        </h2>

        <WeeklyActivity logs={completedExercises} />
      </div>
    </div>
  );
};

export default Dashboard;