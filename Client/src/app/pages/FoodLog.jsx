import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import ProgressBar from '../components/ProgressBar';
import { searchFoods, logFood, getFoodLogs } from '../services/api';

const FoodLog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [searching, setSearching] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayLogs();
  }, []);

  const loadTodayLogs = async () => {
    try {
      // TODO: GET /food_logs
      const response = await getFoodLogs(today);
      setTodayLogs(response.data);
    } catch (error) {
      console.error('Failed to load food logs:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // TODO: GET /foods
      // Search foods from foods table
      const response = await searchFoods(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search foods:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFood = async (food, quantity = 1) => {
    try {
      // TODO: POST /food_logs
      // Tables: food_logs
      await logFood({
        foodId: food.id,
        name: food.name,
        quantity,
        calories: food.calories * quantity,
        protein: food.protein * quantity,
        carbs: food.carbs * quantity,
        fat: food.fat * quantity,
      });

      loadTodayLogs();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to log food:', error);
    }
  };

  // Calculate totals
  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Example targets (would come from user profile)
  const targets = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Food Log</h1>
        <p className="text-gray-600">Track your daily nutrition</p>
      </div>

      {/* Daily Progress */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Today's Progress</h2>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-800">Calories</span>
              <span className="text-gray-600">
                {totals.calories} / {targets.calories}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gray-800 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }}
              />
            </div>
          </div>

          <ProgressBar
            label="Protein"
            current={totals.protein}
            target={targets.protein}
            color="blue"
          />

          <ProgressBar
            label="Carbs"
            current={totals.carbs}
            target={targets.carbs}
            color="orange"
          />

          <ProgressBar
            label="Fat"
            current={totals.fat}
            target={targets.fat}
            color="green"
          />
        </div>
      </div>

      {/* Search Food */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add Food</h2>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for food..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((food) => (
              <div
                key={food.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{food.name}</p>
                  <p className="text-sm text-gray-600">
                    {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                  </p>
                </div>
                <button
                  onClick={() => handleAddFood(food)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Logs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Foods</h2>

        {todayLogs.length > 0 ? (
          <div className="space-y-3">
            {todayLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{log.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {log.quantity} • {log.calories} cal
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-blue-600">P: {log.protein}g</p>
                  <p className="text-orange-600">C: {log.carbs}g</p>
                  <p className="text-green-600">F: {log.fat}g</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No foods logged yet. Start tracking!</p>
        )}
      </div>
    </div>
  );
};

export default FoodLog;