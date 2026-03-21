import axios from 'axios';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
// TODO: Replace with actual backend URL
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true
});

// DEBUG LOGGER
api.interceptors.request.use((req) => {
  console.log("API REQUEST:", req.method?.toUpperCase(), req.url, req.data);
  return req;
});

api.interceptors.response.use(
  (res) => {
    console.log("API RESPONSE:", res.status, res.config.url, res.data);
    return res;
  },
  (err) => {
    console.error("API ERROR:", err.response?.status, err.response?.data);
    return Promise.reject(err);
  }

);
api.interceptors.response.use(
  (res) => {
    console.log("API SUCCESS:", res.config.url, res.data);
    return res;
  },
  (err) => {
    console.error("API ERROR:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);
// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {

  const token = localStorage.getItem("jwt_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {

      originalRequest._retry = true;

      try {

        const res = await api.post("/auth/refresh");

        const newToken = res.data.accessToken;

        localStorage.setItem("jwt_token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (err) {

        localStorage.removeItem("jwt_token");

        window.location.href = "/login";

      }
    }

    return Promise.reject(error);

  }
);
export const logout = async () => {

  await api.post("/auth/logout");

  localStorage.removeItem("jwt_token");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }

};
export const getCurrentUser = async () => {

  const token = localStorage.getItem("jwt_token");

  if (!token) return null;

  const res = await api.get("/auth/me");

  return res.data;

};
// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// TODO: POST /register
// Backend:
// - Hash password using bcrypt
// - Store in users table (Neon PostgreSQL)
// - Never expose password_hash
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);

  const { accessToken } = response.data;

  if (accessToken) {
    localStorage.setItem("jwt_token", accessToken);
  }

  return response;
};

// TODO: POST /login
// Backend:
// - Verify password with bcrypt.compare()
// - Generate JWT with user id and expiry
// - Return JWT token
export const login = async (identifier, password) => {

  const res = await api.post("/auth/login", {
    identifier,
    password
  });

  localStorage.setItem("jwt_token", res.data.accessToken);

  return res.data;

};

// TODO: Firebase integration
// sendPasswordResetEmail(auth, email)
// Firebase handles secure token + email delivery
// Backend JWT authentication remains separate
export const requestPasswordReset = async (email) => {
  return api.post("/auth/forgot-password", { email });
};
export const resetPasswordWithToken = (token, password) => {
  return api.post(`/auth/reset-password/${token}`, { password });
};
// ============================================
// USER PROFILE ENDPOINTS
// ============================================

// TODO: POST /user-profile
// Database: user_profiles
// Increment profile_change_version on update
export const createUserProfile = async (profileData) => {
  return api.post('/onboarding', profileData);
};

export const updateUserProfile = async (profileData) => {
  return api.put('/onboarding', profileData);
};

export const getUserProfile = async () => {
  return api.get('/onboarding');
};
// ============================================
// INJURIES, HEALTH, ALLERGIES, DIET ENDPOINTS
// ============================================

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

// TODO: Save to user_injuries table (many-to-many relationship)
export const saveUserInjuries = async (injuries) => {
  return api.post('/user-injuries', { injuries });
};

// TODO: Save to user_health_conditions table
export const saveHealthConditions = async (conditions) => {
  return api.post('/user-health-conditions', { conditions });
};

// TODO: Save to user_allergies table
export const saveAllergies = async (allergies) => {
  return api.post('/user-allergies', { allergies });
};

// TODO: Save to user_dietary_restrictions table
export const saveDietaryRestrictions = async (restrictions) => {
  return api.post('/user-dietary-restrictions', { restrictions });
};

// ============================================
// GET USER'S EXISTING SELECTIONS (FOR EDIT MODE)
// ============================================

// TODO: GET /user-injuries
// Database: user_injuries table
// Returns array of injury IDs for current user
export const getUserInjuries = async () => {
  return api.get('/user-injuries');
};

// TODO: GET /user-health-conditions
// Database: user_health_conditions table
// Returns array of condition IDs for current user
export const getUserHealthConditions = async () => {
  return api.get('/user-health-conditions');
};

// TODO: GET /user-allergies
// Database: user_allergies table
// Returns array of allergy IDs for current user
export const getUserAllergies = async () => {
  return api.get('/user-allergies');
};

// TODO: GET /user-dietary-restrictions
// Database: user_dietary_restrictions table
// Returns array of restriction IDs for current user
export const getUserDietaryRestrictions = async () => {
  return api.get('/user-dietary-restrictions');
};

// ============================================
// WORKOUT PLAN ENDPOINTS
// ============================================

// TODO: GET /generateFullPlan
// Backend:
// - Check profile_change_version
// - Regenerate plans if outdated
// AI runs in:
// - workoutEngine.js
// - mealEngine.js
// Plans stored in generated_plans table
export const generateFullPlan = async () => {
  return api.get('/plans/generate');
};

// TODO: GET /workout
// AI Server-Side:
// - safetyFilter.js
// - difficultyEngine.js
// Uses:
// - exercises table
// - exercise_contraindications table
export const getWorkout = async () => {
  return api.get('/plans/workout');
};

// TODO: POST /workout/complete
// Save to workout_logs
// Update user_streaks
// Update user_points
// Update AI feedback modifier
export const completeWorkout = async (workoutData) => {
  return api.post('/workouts/log', workoutData);
};

// TODO: GET /workout/history
// Database:
// - workout_logs
// - user_streaks
export const getWorkoutHistory = async () => {
  return api.get('/workouts/history');
};
export const getWeeklyActivity = () => {
  return api.get('/workouts/weekly-activity');
};
export const submitWorkoutRating = ({ rating, day }) =>
  api.post('/workouts/workout-rating', { rating, day });
// ============================================
// MEAL PLAN ENDPOINTS
// ============================================

// TODO: GET /meal-plan
// Backend AI:
// - Remove allergens
// - Filter dietary compatibility
// - Calculate BMR using Mifflin-St Jeor
// - Adjust by goal
// Uses meals table
export const getMealPlan = async () => {
  return api.get('/plans/meal');
};

// ============================================
// FOOD LOG ENDPOINTS
// ============================================

// TODO: GET /foods
// Search foods from foods table
export const searchFoods = async (query) => {
  return api.get(`/foods?search=${query}`);
};

// TODO: POST /food_logs
// Tables: food_logs
export const logFood = async (mealData) => {
  return api.post('/meals/log', mealData);
};

// TODO: GET /food_logs
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
// ============================================
// SOCIAL ENDPOINTS
// ============================================

// TODO: GET /public-users
// Filter users where is_public = true
export const getPublicUsers = async () => {
  return api.get('/public-users');
};

// TODO: POST /post_likes
/* export const likePost = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { success: true } });
    }, 300);
  });
};
*/
// ============================================
// STATS ENDPOINTS
// ============================================
export const getCompletedExercisesToday = async () => {

  const res = await api.get("/workouts/completed-today");

  return res.data;

};
export const getUserStats = async () => {

  const res = await api.get("/workouts/history");

  const logs = res.data.logs || [];

  const points = logs.length * 10; // simple points system

  const today = new Date();
  const startOfWeek = new Date();
  startOfWeek.setDate(today.getDate() - today.getDay());

  const weeklyCompleted = logs.filter(log => {
    const date = new Date(log.completed_at);
    return date >= startOfWeek;
  }).length;

  return {
    data: {
      streak: res.data.streaks?.current || 0,
      points,
      weeklyCompleted,
      weeklyGoal: 4
    }
  };

};

export default api;