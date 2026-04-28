import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getCurrentUser } from './services/api';

// Auth Pages
import Register from './pages/Register';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import NewPassword from './pages/NewPassword';

// App Pages
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import WorkoutHistory from './pages/WorkoutHistory';
import MealPlan from './pages/MealPlan';
import FoodLog from './pages/FoodLog';
import Social from './pages/Social';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('jwt_token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        console.log('User session restored:', user);
      } catch (err) {
        console.log('User not logged in');
      }
    };

    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<NewPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workout" element={<Workout />} />
          <Route path="workout-history" element={<WorkoutHistory />} />
          <Route path="meal-plan" element={<MealPlan />} />
          <Route path="food-log" element={<FoodLog />} />
          <Route path="social" element={<Social />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;