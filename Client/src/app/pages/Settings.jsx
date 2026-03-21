import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Trash2, Edit3, Bell, Shield } from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: true,
    progressUpdates: false,
    socialActivity: true,
  });

  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    // TODO: POST /change-password endpoint
    // TODO: Validate current password
    // TODO: Hash new password with bcrypt
    toast.info('Change password functionality coming soon');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    // TODO: POST /delete-account endpoint
    // TODO: Require password confirmation
    // TODO: Soft delete (set deleted_at timestamp) or hard delete
    // TODO: Clear all user data from database
    toast.error('Account deletion is permanent and cannot be undone');
    setShowDeleteConfirm(false);
  };

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
    // TODO: PATCH /user-settings/notifications
    // TODO: Update user_settings table
    toast.success('Notification preferences updated');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Onboarding Preferences */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Edit3 className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Edit Onboarding Preferences</h3>
            <p className="text-gray-600 mb-4">
              Update your fitness goals, injuries, health conditions, allergies, and dietary preferences.
            </p>
            <button
              onClick={() => navigate('/onboarding?edit=true')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Edit Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
            <p className="text-sm text-gray-600">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Workout Reminders</p>
              <p className="text-sm text-gray-600">Get reminded to complete your daily workout</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.workoutReminders}
              onChange={() => handleNotificationChange('workoutReminders')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Meal Reminders</p>
              <p className="text-sm text-gray-600">Get reminded to log your meals</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.mealReminders}
              onChange={() => handleNotificationChange('mealReminders')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Progress Updates</p>
              <p className="text-sm text-gray-600">Weekly summaries of your progress</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.progressUpdates}
              onChange={() => handleNotificationChange('progressUpdates')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Social Activity</p>
              <p className="text-sm text-gray-600">Updates from users you follow</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.socialActivity}
              onChange={() => handleNotificationChange('socialActivity')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Security</h3>
            <p className="text-sm text-gray-600">Manage your security settings</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-4">
            <Lock className="text-gray-600 mt-1" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">Change Password</h4>
              <p className="text-sm text-gray-600 mb-3">
                Update your password to keep your account secure
              </p>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-800">Danger Zone</h3>
            <p className="text-sm text-red-600">Irreversible actions</p>
          </div>
        </div>

        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-start gap-4">
            <Trash2 className="text-red-600 mt-1" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">Delete Account</h4>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white border-2 border-red-300 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      Are you absolutely sure?
                    </p>
                    <p className="text-sm text-red-700 mb-3">
                      This will permanently delete all your data including workouts, meal plans, and progress.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Yes, Delete My Account
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
