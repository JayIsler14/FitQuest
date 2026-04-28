import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, UtensilsCrossed, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const bottomNavItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/workout', label: 'Workout', icon: Dumbbell },
    { path: '/meal-plan', label: 'Meals', icon: UtensilsCrossed },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="page-shell">
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 safe-bottom">
        <div className="flex justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;