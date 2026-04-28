import axios from 'axios';
import { auth } from "../../firebase";

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const withAuthHeader = (config) => {
  const token = localStorage.getItem('jwt_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

api.interceptors.request.use((config) => {
  const nextConfig = withAuthHeader(config);
  console.log('API REQUEST:', nextConfig.method?.toUpperCase(), nextConfig.url, nextConfig.data);
  return nextConfig;
});

api.interceptors.response.use(
  (response) => {
    console.log('API RESPONSE:', response.status, response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error('API ERROR:', error.response?.status, error.response?.data || error.message);

    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.accessToken;

        localStorage.setItem('jwt_token', newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('jwt_token');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const requestWithFallback = async (requests) => {
  let lastError;

  for (const requestFactory of requests) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;

      const status = error?.response?.status;

      if (status && status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  throw lastError;
};

const healthRouteFallbacks = {
  injuries: ['/userHealth/user-injuries', '/user-injuries'],
  healthConditions: ['/userHealth/user-health-conditions', '/user-health-conditions'],
  allergies: ['/userHealth/user-allergies', '/user-allergies'],
  dietaryRestrictions: ['/userHealth/user-dietary-restrictions', '/user-dietary-restrictions'],
};

const getManyToManySelections = async (key) => {
  const [primary, fallback] = healthRouteFallbacks[key];

  return requestWithFallback([
    () => api.get(primary),
    () => api.get(fallback),
  ]);
};

const saveManyToManySelections = async (key, bodyKey, values) => {
  const [primary, fallback] = healthRouteFallbacks[key];
  const payload = { [bodyKey]: values };

  return requestWithFallback([
    () => api.post(primary, payload),
    () => api.post(fallback, payload),
  ]);
};

export const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('jwt_token');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('jwt_token');

  if (!token) return null;

  const res = await api.get('/auth/me');
  return res.data;
};


// AUTHENTICATION ENDPOINTS


export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  const { accessToken } = response.data;

  if (accessToken) {
    localStorage.setItem('jwt_token', accessToken);
  }

  return response;
};

export const login = async (identifier, password) => {
  const res = await api.post('/auth/login', { identifier, password });
  localStorage.setItem('jwt_token', res.data.accessToken);
  return res.data;
};

export const requestPasswordReset = async (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPasswordWithToken = (token, password) => {
  return api.post(`/auth/reset-password/${token}`, { password });
};


// USER PROFILE ENDPOINTS


export const createUserProfile = async (profileData) => {
  return api.post('/onboarding', profileData);
};

export const updateUserProfile = async (profileData) => {
  return api.put('/onboarding', profileData);
};

export const getUserProfile = async () => {
  return api.get('/onboarding');
};


// INJURIES, HEALTH, ALLERGIES, DIET ENDPOINTS


export const getInjuries = async () => {
  return api.get('/health/injuries');
};

export const getHealthConditions = async () => {
  return api.get('/health/health-conditions');
};

export const getAllergies = async () => {
  return api.get('/health/allergies');
};

export const getDietaryRestrictions = async () => {
  return api.get('/health/dietary-restrictions');
};

export const saveUserInjuries = async (injuries) => {
  return saveManyToManySelections('injuries', 'injuries', injuries);
};

export const saveHealthConditions = async (conditions) => {
  return saveManyToManySelections('healthConditions', 'conditions', conditions);
};

export const saveAllergies = async (allergies) => {
  return saveManyToManySelections('allergies', 'allergies', allergies);
};

export const saveDietaryRestrictions = async (restrictions) => {
  return saveManyToManySelections('dietaryRestrictions', 'restrictions', restrictions);
};

export const getUserInjuries = async () => {
  return getManyToManySelections('injuries');
};

export const getUserHealthConditions = async () => {
  return getManyToManySelections('healthConditions');
};

export const getUserAllergies = async () => {
  return getManyToManySelections('allergies');
};

export const getUserDietaryRestrictions = async () => {
  return getManyToManySelections('dietaryRestrictions');
};


// WORKOUT PLAN ENDPOINTS


export const generateFullPlan = async () => {
  return api.get('/plans/generate');
};

export const getWorkout = async () => {
  return api.get('/plans/workout');
};

export const completeWorkout = async (workoutData) => {
  return api.post('/workouts/log', workoutData);
};

export const getWorkoutHistory = async () => {
  return api.get('/workouts/history');
};

export const getWeeklyActivity = () => {
  return api.get('/workouts/weekly-activity');
};

export const submitWorkoutRating = ({ rating, day }) =>
  api.post('/workouts/workout-rating', { rating, day });

export const getBonusWorkoutPack = () => api.get('/workouts/bonus-pack');

export const swapWorkoutExercise = async ({
  currentExerciseId,
  excludeExerciseIds,
  workoutDay,
  slotIndex
}) => {
  return api.post('/workouts/swap', {
    currentExerciseId,
    excludeExerciseIds,
    workoutDay,
    slotIndex
  });
};

export const swapBonusWorkoutExercise = async ({
  currentExerciseId,
  excludeExerciseIds
}) => {
  return api.post('/workouts/bonus-pack/swap', {
    currentExerciseId,
    excludeExerciseIds
  });
};


// MEAL PLAN ENDPOINTS


export const getMealPlan = async () => {
  return api.get('/plans/meal');
};


// FOOD LOG ENDPOINTS


export const searchFoods = async (query) => {
  return api.get(`/foods?search=${query}`);
};

export const logFood = async (mealData) => {
  return api.post('/meals/log', mealData);
};

export const getFoodLogs = async () => {
  return api.get('/meals/history');
};

export const logMeal = async (mealData) => {
  return api.post('/meals/log', mealData);
};

export const getPosts = async () => {
  return api.get('/social');
};

export const createPost = async (postData) => {
  return api.post('/social', postData);
};

export const likePost = async (postId) => {
  return api.post(`/social/like/${postId}`);
};

export const getMealHistory = async () => {
  return api.get('/meals/history');
};


// SOCIAL ENDPOINTS


export const getPublicUsers = async () => {
  return api.get('/public-users');
};

export const followUser = async (userId) => {
  return api.post(`/social/follow/${userId}`);
};

export const unfollowUser = async (userId) => {
  return api.delete(`/social/follow/${userId}`);
};

export const getFollowStatus = async (userId) => {
  return api.get(`/social/follow-status/${userId}`);
};

export const getFollowers = async () => {
  return api.get('/social/followers');
};

export const getFollowing = async () => {
  return api.get('/social/following');
};


// STATS ENDPOINTS


export const getUserStats = async () => {
  const res = await api.get('/workouts/stats');
  return res;
};

export const getUserProgress = async (userId) => {
  return api.get(`/social/progress/${userId}`);
};

export default api;