import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// NAVIGATION COMPONENT
// Required on all pages except Dashboard per specification
// Provides consistent back navigation to dashboard

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
    >
      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      <span className="font-medium">Dashboard</span>
    </button>
  );
};

export default BackToDashboard;
