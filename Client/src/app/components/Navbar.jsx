import React, { useState, useEffect } from 'react';
import { Menu, Flame, Trophy, ChevronDown } from 'lucide-react';
import { getUserStats } from '../services/api';

const Navbar = ({ onMenuClick }) => {
  const [stats, setStats] = useState({ streak: 0, points: 0 });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <nav className="bg-white border-b px-4 lg:px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left section - Menu button for mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Center section - Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
            <Flame className="text-orange-500" size={20} />
            <span className="font-semibold text-gray-800">{stats.streak}</span>
            <span className="text-sm text-gray-600 hidden sm:inline">day streak</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Trophy className="text-blue-500" size={20} />
            <span className="font-semibold text-gray-800">{stats.points}</span>
            <span className="text-sm text-gray-600 hidden sm:inline">points</span>
          </div>
        </div>

        {/* Right section - User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              U
            </div>
            <ChevronDown size={16} className="text-gray-600" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
              <div className="px-4 py-2 border-b">
                <p className="font-semibold text-gray-800">User</p>
                <p className="text-sm text-gray-600">user@example.com</p>
              </div>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
