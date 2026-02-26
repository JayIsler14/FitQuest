import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import axios from "axios";

//States
import { useState,useEffect } from "react";

// Auth Pages
import Register from './pages/Register';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';

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

// SECURITY NOTES:
// Never store raw passwords
// Never expose password_hash
// Validate JWT on protected routes
// Never trust frontend input
// All filtering must occur server-side

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('jwt_token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {

  const [array, setArray] = useState([]);

  const fetchData = async () => {
    const response = await axios.get("http://localhost:8080");
    setArray(response.data);
  }

  useEffect(() => {
    fetchData();
  }, [])
  
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Onboarding (protected) */}
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
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
