import React, { useState, useEffect } from 'react';
import {
  Save,
  Edit3,
  LogOut,
  ChevronDown,
  ChevronUp,
  Heart,
  Calendar,
  Users,
  UserPlus
} from 'lucide-react';
import BackToDashboard from '../components/BackToDashboard';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

import {
  getUserProfile,
  updateUserProfile,
  getCurrentUser,
  logout,
  createPost,
  likePost,
  getPosts,
  generateFullPlan
} from '../services/api';

const FOLLOW_PREVIEW_COUNT = 3;

const normalizeProfileForState = (data = {}) => ({
  age: data.age ?? '',
  height: data.height ?? '',
  weight: data.weight ?? '',
  goal: data.goal ?? 'maintain',
  level: data.level ?? 1,
  intensity: data.intensity ?? 1,
  weeklyAvailability:
    data.weeklyAvailability ??
    data.weekly_availability ??
    '1-2',
  isPublic:
    data.isPublic ??
    data.is_public ??
    false,
  injuries: data.injuries ?? [],
  allergies: data.allergies ?? [],
  healthConditions:
    data.healthConditions ??
    data.health_conditions ??
    [],
  dietaryRestrictions:
    data.dietaryRestrictions ??
    data.dietary_restrictions ??
    []
});

const buildProfilePayload = (profile) => ({
  age: profile.age === '' ? null : Number(profile.age),
  height: profile.height === '' ? null : Number(profile.height),
  weight: profile.weight === '' ? null : Number(profile.weight),
  goal: profile.goal,
  level: Number(profile.level),
  intensity: Number(profile.intensity),
  weeklyAvailability: profile.weeklyAvailability,
  isPublic: !!profile.isPublic,
  injuries: profile.injuries || [],
  allergies: profile.allergies || [],
  healthConditions: profile.healthConditions || [],
  dietaryRestrictions: profile.dietaryRestrictions || []
});

const formatPostDate = (dateString) => {
  if (!dateString) return 'Recently';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getLikeCount = (post) => {
  if (post?.likes !== undefined && post?.likes !== null) {
    return Number(post.likes) || 0;
  }

  if (post?.like_count !== undefined && post?.like_count !== null) {
    return Number(post.like_count) || 0;
  }

  return 0;
};

const hasViewerLikedPost = (post) => {
  return !!(
    post?.viewerHasLiked ||
    post?.viewer_has_liked ||
    post?.hasLiked ||
    post?.liked_by_current_user
  );
};

const PostCard = ({ post, onLike, isPublicView = false }) => {
  const likeCount = getLikeCount(post);
  const viewerHasLiked = hasViewerLikedPost(post);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {post.username || post.user?.username || 'User'}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Calendar size={13} />
            <span>{formatPostDate(post.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-gray-800 text-[15px] leading-7 whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={() => onLike(post.id)}
          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            viewerHasLiked
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart
            size={16}
            className={viewerHasLiked ? 'fill-red-500 text-red-500' : ''}
          />
          <span>
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </button>

        {isPublicView && (
          <span className="text-xs text-gray-400">Public post</span>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !id;

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showAllFollowers, setShowAllFollowers] = useState(false);
  const [showAllFollowing, setShowAllFollowing] = useState(false);

  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadPublicProfile();
    } else {
      loadOwnProfile();
    }
  }, [id]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);

      const [progressRes, postsRes] = await Promise.all([
        api.get(`/social/progress/${id}`),
        api.get(`/social/user/${id}`)
      ]);

      setUser(progressRes.data);
      setPosts(postsRes.data || []);

      try {
        const followStatusRes = await api.get(`/social/follow-status/${id}`);
        setIsFollowingUser(!!followStatusRes.data?.isFollowing);
      } catch (followErr) {
        console.error('Failed to load follow status:', followErr);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load public profile');
    } finally {
      setLoading(false);
    }
  };

  const loadOwnProfile = async () => {
    try {
      setLoading(true);

      const [profileRes, userData, postsRes, followersRes, followingRes] =
        await Promise.all([
          getUserProfile(),
          getCurrentUser(),
          getPosts(),
          api.get('/social/followers'),
          api.get('/social/following')
        ]);

      setProfile(normalizeProfileForState(profileRes.data || {}));
      setUser(userData);
      setPosts(postsRes.data || []);
      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    try {
      setPosting(true);
      const res = await createPost({ content: newPost.trim() });

      const newCreatedPost = res?.data?.id
        ? {
            ...res.data,
            viewer_has_liked: false,
            likes: Number(res.data.likes ?? 0)
          }
        : {
            id: Date.now(),
            content: newPost.trim(),
            created_at: new Date().toISOString(),
            likes: 0,
            like_count: 0,
            viewer_has_liked: false,
            username: user?.username
          };

      setPosts((prev) => [newCreatedPost, ...prev]);
      setNewPost('');
      toast.success('Post created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const targetPost = posts.find((post) => post.id === postId);

      if (targetPost && hasViewerLikedPost(targetPost)) {
        return;
      }

      const res = await likePost(postId);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const returnedLikes =
            res?.data?.likes ??
            res?.data?.like_count ??
            res?.data?.likeCount;

          const nextLikeCount =
            returnedLikes !== undefined
              ? Number(returnedLikes)
              : getLikeCount(post) + 1;

          return {
            ...post,
            likes: nextLikeCount,
            like_count: nextLikeCount,
            viewer_has_liked: true,
            viewerHasLiked: true
          };
        })
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to like post');
    }
  };

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);

      if (isFollowingUser) {
        const res = await api.delete(`/social/follow/${id}`);
        setIsFollowingUser(false);
        setUser((prev) => ({
          ...prev,
          followersCount: res.data.followersCount
        }));
        toast.success('Unfollowed user');
      } else {
        const res = await api.post(`/social/follow/${id}`);
        setIsFollowingUser(true);
        setUser((prev) => ({
          ...prev,
          followersCount: res.data.followersCount
        }));
        toast.success('Now following user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      await updateUserProfile(buildProfilePayload(profile));

      try {
        await generateFullPlan();
      } catch (planError) {
        console.warn(
          'Plan pre-generation failed, plan will regenerate on next fetch:',
          planError
        );
      }

      window.dispatchEvent(new Event('profile-updated'));
      window.dispatchEvent(new Event('workout-plan-updated'));

      toast.success('Profile updated successfully!');
      await loadOwnProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const visibleFollowers = showAllFollowers
    ? followers
    : followers.slice(0, FOLLOW_PREVIEW_COUNT);

  const visibleFollowing = showAllFollowing
    ? following
    : following.slice(0, FOLLOW_PREVIEW_COUNT);

  const renderUserList = (list, emptyText) => {
    if (!list.length) {
      return (
        <div className="border border-gray-200 rounded-2xl p-5 text-center text-gray-500 bg-gray-50">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((person) => (
          <Link
            key={person.id}
            to={`/profile/${person.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition"
          >
            <p className="font-semibold text-gray-800">{person.username}</p>
            {person.goal && (
              <p className="text-sm text-gray-500 mt-1">{person.goal}</p>
            )}
          </Link>
        ))}
      </div>
    );
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <BackToDashboard />

          <div className="space-y-6 mt-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Public Profile</p>
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {user?.username}
                  </h1>
                </div>

                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    isFollowingUser
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {followLoading
                    ? 'Updating...'
                    : isFollowingUser
                    ? 'Following'
                    : 'Follow'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                  <p className="text-sm text-orange-700 mb-1">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.streak || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">day streak</p>
                </div>

                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-sm text-blue-700 mb-1">Points</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.points || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">total points</p>
                </div>

                <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
                  <p className="text-sm text-purple-700 mb-1">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.followersCount || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                  <p className="text-sm text-green-700 mb-1">Following</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.followingCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Posts</h2>
                <span className="text-sm text-gray-500">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="border border-gray-200 rounded-2xl p-8 text-center text-gray-500 bg-gray-50">
                  This user hasn&apos;t posted anything yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLikePost}
                      isPublicView
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BackToDashboard />

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">
            Manage your account, preferences, and posts
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-stretch">
          <div className="xl:col-span-4">
            <div className="space-y-6 h-full">
              <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Account</p>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  {user?.username}
                </h2>
                <p className="text-gray-500 mt-1 break-all">{user?.email}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users size={18} />
                    Followers ({followers.length})
                  </h2>

                  {followers.length > FOLLOW_PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllFollowers((prev) => !prev)}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showAllFollowers ? (
                        <>
                          Show less <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          Show all <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {renderUserList(
                  visibleFollowers,
                  'You do not have any followers yet.'
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus size={18} />
                    Following ({following.length})
                  </h2>

                  {following.length > FOLLOW_PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllFollowing((prev) => !prev)}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showAllFollowing ? (
                        <>
                          Show less <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          Show all <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {renderUserList(
                  visibleFollowing,
                  'You are not following anyone yet.'
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={profile?.age}
                      onChange={(e) =>
                        setProfile({ ...profile, age: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={profile?.height}
                      onChange={(e) =>
                        setProfile({ ...profile, height: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={profile?.weight}
                      onChange={(e) =>
                        setProfile({ ...profile, weight: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fitness Goal
                    </label>
                    <select
                      value={profile?.goal}
                      onChange={(e) =>
                        setProfile({ ...profile, goal: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="loss">Weight Loss</option>
                      <option value="maintain">Maintain Weight</option>
                      <option value="gain">Muscle Gain</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Experience & Preferences
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Experience Level: {profile?.level}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={profile?.level}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          level: parseInt(e.target.value, 10)
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Intensity: {profile?.intensity}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={profile?.intensity}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          intensity: parseInt(e.target.value, 10)
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Light</span>
                      <span>Intense</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Availability
                    </label>
                    <select
                      value={profile?.weeklyAvailability}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          weeklyAvailability: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1-2">1-2 days per week</option>
                      <option value="3-4">3-4 days per week</option>
                      <option value="5-6">5-6 days per week</option>
                      <option value="7">Every day</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Privacy Settings
                </h3>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!!profile?.isPublic}
                    onChange={(e) =>
                      setProfile({ ...profile, isPublic: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Make Profile Public</p>
                    <p className="text-sm text-gray-600">
                      Allow other users to see your progress and achievements
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Account Settings
                </h3>

                <div className="border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Onboarding Preferences
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Update your fitness goals, injuries, health conditions,
                    allergies, and dietary preferences.
                  </p>
                  <button
                    onClick={() => navigate('/onboarding?edit=true')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 size={18} />
                    Edit Preferences
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Updating your profile will regenerate your
                  workout and meal plans to better match your current goals and
                  preferences.
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    await logout();
                    toast.success('Logged out successfully');
                    navigate('/login');
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to log out');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-2xl hover:bg-red-600 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>

          <div className="xl:col-span-8 flex">
            <div className="flex flex-col gap-6 w-full h-full">
              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Post An Update:
                </h2>

                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share an update with your followers..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                  rows={4}
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleCreatePost}
                    disabled={posting || !newPost.trim()}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-200 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-5 gap-4">
                  <h2 className="text-xl font-bold text-gray-900">Your Posts</h2>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                {posts.length === 0 ? (
                  <div className="border border-gray-200 rounded-2xl p-6 text-center text-gray-500 bg-gray-50 flex-1 flex items-center justify-center">
                    You haven&apos;t posted anything yet.
                  </div>
                ) : (
                  <div className="space-y-4 h-full">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={{
                          ...post,
                          username: post.username || user?.username
                        }}
                        onLike={handleLikePost}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;