import React, { useState, useEffect } from 'react';
import { User, Save, Edit3, LogOut, Settings } from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getUserProfile, updateUserProfile } from '../services/api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from "../services/api";

const Profile = () => {

  const { id } = useParams();
  const isOwnProfile = !id;
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {

    if (id) {
      loadPublicProfile();   // viewing another user
    } else {
      loadOwnProfile();      // your own profile
    }

  }, [id]);

  const loadPublicProfile = async () => {
    try {
      const progressRes = await api.get(`/social/progress/${id}`);
      const postsRes = await api.get(`/social/user/${id}`);

      setUser(progressRes.data);
      setPosts(postsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }

  };

  const loadOwnProfile = async () => {
    try {
      
      const profileRes = await getUserProfile();
      setProfile(profileRes.data);

      const userData = await getCurrentUser();
      setUser(userData);

      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  
  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch {
      console.log("Not logged in");
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: PATCH /user-profile
      // Increment profile_change_version
      // Invalidate generated_plans
      await updateUserProfile(profile);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">

        <BackToDashboard />

        {/* USER INFO */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h1 className="text-2xl font-bold">{user?.username}</h1>
          <p className="text-gray-600">Public Profile</p>

          <div className="mt-3 flex gap-4">
            <span>🔥 {user?.streak} day streak</span>
            <span>🏆 {user?.points} points</span>
          </div>
        </div>

        {/* POSTS */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Posts</h2>

          {posts.length === 0 ? (
            <p>No posts yet</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="border-b py-2">
                <p>{post.content}</p>
                <p>❤️ {post.likes} likes</p>
              </div>
            ))
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackToDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goal</label>
            <select
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="loss">Weight Loss</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Muscle Gain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experience & Preferences */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Experience & Preferences</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Experience Level: {profile.level}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={profile.level}
              onChange={(e) => setProfile({ ...profile, level: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Beginner</span>
              <span>Expert</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Intensity: {profile.intensity}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={profile.intensity}
              onChange={(e) => setProfile({ ...profile, intensity: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Light</span>
              <span>Intense</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Availability</label>
            <select
              value={profile.weeklyAvailability}
              onChange={(e) => setProfile({ ...profile, weeklyAvailability: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1-2">1-2 days per week</option>
              <option value="3-4">3-4 days per week</option>
              <option value="5-6">5-6 days per week</option>
              <option value="7">Every day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Privacy Settings</h3>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={profile.isPublic}
            onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <p className="font-medium text-gray-800">Make Profile Public</p>
            <p className="text-sm text-gray-600">
              Allow other users to see your progress and achievements
            </p>
          </div>
        </label>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h3>

        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">Onboarding Preferences</h4>
              <p className="text-sm text-gray-600 mb-3">
                Update your fitness goals, injuries, health conditions, allergies, and dietary preferences.
              </p>
              <button
                onClick={() => {
                  // TODO: Navigate to onboarding in edit mode
                  // TODO: Pass query param ?edit=true
                  navigate('/onboarding?edit=true');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Edit3 size={18} />
                Edit Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        <Save size={20} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Updating your profile will regenerate your workout and meal plans
          to better match your current goals and preferences.
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={async () => {
          await logout();
          toast.success("Logged out successfully");
          navigate("/login");
        }}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg"
      >
        <LogOut size={20} />
          Logout
      </button>
    </div>
  );
};

export default Profile;