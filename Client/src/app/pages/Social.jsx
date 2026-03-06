import React, { useState, useEffect } from 'react';
import { Search, Flame, Heart } from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import { getPublicUsers, likePost } from '../services/api';

const Social = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [likedUsers, setLikedUsers] = useState(new Set());

  useEffect(() => {
    loadPublicUsers();
  }, []);

  const loadPublicUsers = async () => {
    try {
      // TODO: GET /public-users
      // Filter users where is_public = true
      const response = await getPublicUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId) => {
    try {
      // TODO: POST /post_likes
      await likePost(userId);
      setLikedUsers(new Set([...likedUsers, userId]));
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Social Community</h1>
        <p className="text-gray-600">Connect with other fitness enthusiasts</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or goal..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">{user.username}</h3>
                <p className="text-sm text-gray-600">{user.goal}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="text-orange-500" size={20} />
                <span className="font-semibold text-gray-800">{user.streak} day streak</span>
              </div>
              <p className="text-sm text-gray-600">
                "Staying consistent and pushing my limits every day! 💪"
              </p>
            </div>

            {/* Like button */}
            <button
              onClick={() => handleLike(user.id)}
              disabled={likedUsers.has(user.id)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                likedUsers.has(user.id)
                  ? 'bg-red-100 text-red-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Heart size={20} className={likedUsers.has(user.id) ? 'fill-current' : ''} />
              {likedUsers.has(user.id) ? 'Liked' : 'Like'}
            </button>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600">No users found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Social;