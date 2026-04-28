import React, { useState, useEffect } from 'react';
import { Menu, Flame, Trophy } from 'lucide-react';
import { getUserStats } from '../services/api';

const Navbar = ({ onMenuClick }) => {
  const [stats, setStats] = useState({ streak: 0, points: 0 });

  useEffect(() => {
    loadStats();

    const handleFocus = () => loadStats();
    const handleStatsUpdated = () => loadStats();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('stats-updated', handleStatsUpdated);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('stats-updated', handleStatsUpdated);
    };
  }, []);

  const loadStats = async () => {
    try {
      const response = await getUserStats();
      setStats(response.data || { streak: 0, points: 0 });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <header className="navbar-outer">
      <div className="navbar-inner">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            type="button"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
            <Flame className="text-orange-500" size={18} />
            <span className="font-semibold text-gray-800">{stats.streak}</span>
            <span className="text-sm text-gray-600 hidden sm:inline">
              day streak
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Trophy className="text-blue-500" size={18} />
            <span className="font-semibold text-gray-800">{stats.points}</span>
            <span className="text-sm text-gray-600 hidden sm:inline">
              points
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;