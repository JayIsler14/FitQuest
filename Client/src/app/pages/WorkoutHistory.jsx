import React, { useState, useEffect } from 'react';
import { Flame, Trophy } from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import Calendar from '../components/Calendar';
import { getWorkoutHistory } from '../services/api';

const WorkoutHistory = () => {
  const [history, setHistory] = useState({ logs: [], streaks: { current: 0, longest: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // TODO: GET /workout/history
      // Database:
      // - workout_logs
      // - user_streaks
      const response = await getWorkoutHistory();
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Workout History</h1>
        <p className="text-gray-600">Track your fitness journey</p>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Flame size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Current Streak</h3>
              <p className="text-orange-100 text-sm">Keep it going!</p>
            </div>
          </div>
          <p className="text-5xl font-bold">{history.streaks.current}</p>
          <p className="text-orange-100 mt-2">consecutive days</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Longest Streak</h3>
              <p className="text-purple-100 text-sm">Personal best</p>
            </div>
          </div>
          <p className="text-5xl font-bold">{history.streaks.longest}</p>
          <p className="text-purple-100 mt-2">consecutive days</p>
        </div>
      </div>

      {/* Calendar */}
      <Calendar workoutLogs={history.logs} />

      {/* Recent workouts */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Workouts</h2>
        {history.logs.length > 0 ? (
          <div className="space-y-3">
            {history.logs.slice(0, 5).map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {log.exercises?.length || 0} exercises completed
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-8 rounded ${
                        i < (log.rating || 3) ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No workouts completed yet. Start today!</p>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;