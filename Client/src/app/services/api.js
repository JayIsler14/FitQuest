import axios from 'axios';

// TODO: Replace with actual backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // TODO: In production, use httpOnly cookies (preferred)
    // For demo, we use localStorage
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// TODO: POST /register
// Backend:
// - Hash password using bcrypt
// - Store in users table (Neon PostgreSQL)
// - Never expose password_hash
export const register = async (userData) => {
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser = { id: 1, username: userData.username, email: userData.email };
      resolve({ data: { user: mockUser, token: 'mock_jwt_token' } });
    }, 500);
  });
};

// TODO: POST /login
// Backend:
// - Verify password with bcrypt.compare()
// - Generate JWT with user id and expiry
// - Return JWT token
export const login = async (credentials) => {
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = 'mock_jwt_token';
      const mockUser = { id: 1, username: 'user', email: credentials.email };
      resolve({ data: { token: mockToken, user: mockUser } });
    }, 500);
  });
};

// TODO: Firebase integration
// sendPasswordResetEmail(auth, email)
// Firebase handles secure token + email delivery
// Backend JWT authentication remains separate
export const resetPassword = async (email) => {
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { message: 'Password reset email sent' } });
    }, 500);
  });
};

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

// TODO: POST /user-profile
// Database: user_profiles
// Increment profile_change_version on update
export const createUserProfile = async (profileData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_profile', JSON.stringify(profileData));
      resolve({ data: { success: true } });
    }, 500);
  });
};

// TODO: PATCH /user-profile
// Increment profile_change_version
// Invalidate generated_plans
export const updateUserProfile = async (profileData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_profile', JSON.stringify(profileData));
      resolve({ data: { success: true } });
    }, 500);
  });
};

// TODO: GET /user-profile
export const getUserProfile = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      resolve({ data: profile });
    }, 300);
  });
};

// ============================================
// INJURIES, HEALTH, ALLERGIES, DIET ENDPOINTS
// ============================================

// TODO: GET /injuries
// Database: injuries table
// Returns all available injuries for dynamic rendering
export const getInjuries = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockInjuries = [
        { id: 1, name: 'Knee Injury', description: 'Current or past knee problems' },
        { id: 2, name: 'Shoulder Injury', description: 'Rotator cuff or shoulder issues' },
        { id: 3, name: 'Lower Back Pain', description: 'Chronic or acute lower back problems' },
        { id: 4, name: 'Wrist Pain', description: 'Carpal tunnel or wrist strain' },
        { id: 5, name: 'Ankle Sprain', description: 'Past or current ankle injuries' },
        { id: 6, name: 'Hip Problems', description: 'Hip flexor or joint issues' },
        { id: 7, name: 'Neck Pain', description: 'Cervical spine issues' },
        { id: 8, name: 'Elbow Tendonitis', description: 'Tennis or golfer elbow' },
      ];
      resolve({ data: mockInjuries });
    }, 300);
  });
};

// TODO: GET /health-conditions
// Database: health_conditions table
export const getHealthConditions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockConditions = [
        { id: 1, name: 'Type 2 Diabetes', description: 'Requires careful exercise monitoring' },
        { id: 2, name: 'Heart Disease', description: 'Cardiovascular conditions' },
        { id: 3, name: 'Asthma', description: 'Respiratory condition' },
        { id: 4, name: 'High Blood Pressure', description: 'Hypertension' },
        { id: 5, name: 'Arthritis', description: 'Joint inflammation' },
        { id: 6, name: 'Osteoporosis', description: 'Bone density issues' },
      ];
      resolve({ data: mockConditions });
    }, 300);
  });
};

// TODO: GET /allergies
// Database: allergies table
export const getAllergies = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAllergies = [
        { id: 1, name: 'Dairy', description: 'Milk, cheese, yogurt' },
        { id: 2, name: 'Tree Nuts', description: 'Almonds, walnuts, cashews' },
        { id: 3, name: 'Peanuts', description: 'Peanut butter and peanuts' },
        { id: 4, name: 'Gluten', description: 'Wheat, barley, rye' },
        { id: 5, name: 'Shellfish', description: 'Shrimp, crab, lobster' },
        { id: 6, name: 'Fish', description: 'All fish varieties' },
        { id: 7, name: 'Soy', description: 'Tofu, soy milk, edamame' },
        { id: 8, name: 'Eggs', description: 'Chicken eggs' },
      ];
      resolve({ data: mockAllergies });
    }, 300);
  });
};

// TODO: GET /dietary-restrictions
// Database: dietary_restrictions table
export const getDietaryRestrictions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockRestrictions = [
        { id: 1, name: 'Vegetarian', description: 'No meat or fish' },
        { id: 2, name: 'Vegan', description: 'No animal products' },
        { id: 3, name: 'Pescatarian', description: 'Fish but no meat' },
        { id: 4, name: 'Keto', description: 'Low-carb, high-fat diet' },
        { id: 5, name: 'Paleo', description: 'Whole foods, no processed' },
        { id: 6, name: 'Halal', description: 'Islamic dietary laws' },
        { id: 7, name: 'Kosher', description: 'Jewish dietary laws' },
      ];
      resolve({ data: mockRestrictions });
    }, 300);
  });
};

// TODO: Save to user_injuries table (many-to-many relationship)
export const saveUserInjuries = async (injuries) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_injuries', JSON.stringify(injuries));
      resolve({ data: { success: true } });
    }, 300);
  });
};

// TODO: Save to user_health_conditions table
export const saveHealthConditions = async (conditions) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_health_conditions', JSON.stringify(conditions));
      resolve({ data: { success: true } });
    }, 300);
  });
};

// TODO: Save to user_allergies table
export const saveAllergies = async (allergies) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_allergies', JSON.stringify(allergies));
      resolve({ data: { success: true } });
    }, 300);
  });
};

// TODO: Save to user_dietary_restrictions table
export const saveDietaryRestrictions = async (restrictions) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('user_dietary_restrictions', JSON.stringify(restrictions));
      resolve({ data: { success: true } });
    }, 300);
  });
};

// ============================================
// GET USER'S EXISTING SELECTIONS (FOR EDIT MODE)
// ============================================

// TODO: GET /user-injuries
// Database: user_injuries table
// Returns array of injury IDs for current user
export const getUserInjuries = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const injuries = JSON.parse(localStorage.getItem('user_injuries') || '[]');
      // If injuries are stored as IDs, convert to expected format
      const formattedInjuries = Array.isArray(injuries) && injuries.length > 0 && typeof injuries[0] === 'number'
        ? injuries.map(id => ({ id }))
        : injuries;
      resolve({ data: formattedInjuries });
    }, 300);
  });
};

// TODO: GET /user-health-conditions
// Database: user_health_conditions table
// Returns array of condition IDs for current user
export const getUserHealthConditions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const conditions = JSON.parse(localStorage.getItem('user_health_conditions') || '[]');
      // If conditions are stored as IDs, convert to expected format
      const formattedConditions = Array.isArray(conditions) && conditions.length > 0 && typeof conditions[0] === 'number'
        ? conditions.map(id => ({ id }))
        : conditions;
      resolve({ data: formattedConditions });
    }, 300);
  });
};

// TODO: GET /user-allergies
// Database: user_allergies table
// Returns array of allergy IDs for current user
export const getUserAllergies = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allergies = JSON.parse(localStorage.getItem('user_allergies') || '[]');
      // If allergies are stored as IDs, convert to expected format
      const formattedAllergies = Array.isArray(allergies) && allergies.length > 0 && typeof allergies[0] === 'number'
        ? allergies.map(id => ({ id }))
        : allergies;
      resolve({ data: formattedAllergies });
    }, 300);
  });
};

// TODO: GET /user-dietary-restrictions
// Database: user_dietary_restrictions table
// Returns array of restriction IDs for current user
export const getUserDietaryRestrictions = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const restrictions = JSON.parse(localStorage.getItem('user_dietary_restrictions') || '[]');
      // If restrictions are stored as IDs, convert to expected format
      const formattedRestrictions = Array.isArray(restrictions) && restrictions.length > 0 && typeof restrictions[0] === 'number'
        ? restrictions.map(id => ({ id }))
        : restrictions;
      resolve({ data: formattedRestrictions });
    }, 300);
  });
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
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockPlan = {
        workout: {
          exercises: [
            {
              id: 1,
              name: 'Push-ups',
              muscleGroup: 'Chest',
              difficulty: 'Intermediate',
              intensity: 4,
              equipment: 'None',
              sets: 3,
              reps: 12,
              formTips: 'Keep your back straight, core engaged',
              commonMistakes: 'Sagging hips, flaring elbows',
              videoLink: 'https://example.com/pushups',
            },
            {
              id: 2,
              name: 'Squats',
              muscleGroup: 'Legs',
              difficulty: 'Beginner',
              intensity: 3,
              equipment: 'None',
              sets: 3,
              reps: 15,
              formTips: 'Knees track over toes, chest up',
              commonMistakes: 'Knees caving in, rounding back',
              videoLink: 'https://example.com/squats',
            },
            {
              id: 3,
              name: 'Plank',
              muscleGroup: 'Core',
              difficulty: 'Beginner',
              intensity: 3,
              equipment: 'None',
              sets: 3,
              duration: '30 seconds',
              formTips: 'Straight line from head to heels',
              commonMistakes: 'Hips too high or too low',
              videoLink: 'https://example.com/plank',
            },
          ],
        },
        meals: {
          breakfast: {
            name: 'Protein Oatmeal Bowl',
            calories: 450,
            protein: 25,
            carbs: 55,
            fat: 12,
          },
          lunch: {
            name: 'Grilled Chicken Salad',
            calories: 520,
            protein: 42,
            carbs: 35,
            fat: 18,
          },
          dinner: {
            name: 'Salmon with Sweet Potato',
            calories: 600,
            protein: 45,
            carbs: 50,
            fat: 22,
          },
          snack: {
            name: 'Greek Yogurt with Berries',
            calories: 180,
            protein: 15,
            carbs: 20,
            fat: 4,
          },
        },
      };
      resolve({ data: mockPlan });
    }, 800);
  });
};

// TODO: GET /workout
// AI Server-Side:
// - safetyFilter.js
// - difficultyEngine.js
// Uses:
// - exercises table
// - exercise_contraindications table
export const getWorkout = async () => {
  return generateFullPlan().then(res => ({ data: res.data.workout }));
};

// TODO: POST /workout/complete
// Save to workout_logs
// Update user_streaks
// Update user_points
// Update AI feedback modifier
export const completeWorkout = async (workoutData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Update workout logs
      const logs = JSON.parse(localStorage.getItem('workout_logs') || '[]');
      logs.push({
        ...workoutData,
        date: new Date().toISOString(),
      });
      localStorage.setItem('workout_logs', JSON.stringify(logs));

      // Update streak
      const streakData = JSON.parse(localStorage.getItem('user_streaks') || '{"current": 0, "longest": 0}');
      streakData.current += 1;
      if (streakData.current > streakData.longest) {
        streakData.longest = streakData.current;
      }
      localStorage.setItem('user_streaks', JSON.stringify(streakData));

      // Update points
      const currentPoints = parseInt(localStorage.getItem('user_points') || '0');
      localStorage.setItem('user_points', (currentPoints + 50).toString());

      resolve({ data: { success: true, pointsEarned: 50 } });
    }, 500);
  });
};

// TODO: GET /workout/history
// Database:
// - workout_logs
// - user_streaks
export const getWorkoutHistory = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs = JSON.parse(localStorage.getItem('workout_logs') || '[]');
      const streaks = JSON.parse(localStorage.getItem('user_streaks') || '{"current": 0, "longest": 0}');
      resolve({ data: { logs, streaks } });
    }, 300);
  });
};

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
  return generateFullPlan().then(res => ({ data: res.data.meals }));
};

// ============================================
// FOOD LOG ENDPOINTS
// ============================================

// TODO: GET /foods
// Search foods from foods table
export const searchFoods = async (query) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockFoods = [
        { id: 1, name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
        { id: 2, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        { id: 3, name: 'Brown Rice', calories: 215, protein: 5, carbs: 45, fat: 1.6 },
        { id: 4, name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0.6 },
      ];
      const filtered = mockFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
      resolve({ data: filtered });
    }, 300);
  });
};

// TODO: POST /food_logs
// Tables: food_logs
export const logFood = async (foodData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs = JSON.parse(localStorage.getItem('food_logs') || '[]');
      logs.push({
        ...foodData,
        date: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('food_logs', JSON.stringify(logs));
      resolve({ data: { success: true } });
    }, 300);
  });
};

// TODO: GET /food_logs
export const getFoodLogs = async (date) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs = JSON.parse(localStorage.getItem('food_logs') || '[]');
      const filtered = logs.filter(log => log.date === date);
      resolve({ data: filtered });
    }, 300);
  });
};

// ============================================
// SOCIAL ENDPOINTS
// ============================================

// TODO: GET /public-users
// Filter users where is_public = true
export const getPublicUsers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUsers = [
        { id: 2, username: 'FitJohn', goal: 'Weight Loss', streak: 15, isPublic: true },
        { id: 3, username: 'Sarah_Strong', goal: 'Muscle Gain', streak: 30, isPublic: true },
        { id: 4, username: 'HealthyMike', goal: 'Maintenance', streak: 45, isPublic: true },
      ];
      resolve({ data: mockUsers });
    }, 500);
  });
};

// TODO: POST /post_likes
export const likePost = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { success: true } });
    }, 300);
  });
};

// ============================================
// STATS ENDPOINTS
// ============================================

export const getUserStats = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const streaks = JSON.parse(localStorage.getItem('user_streaks') || '{"current": 0, "longest": 0}');
      const points = parseInt(localStorage.getItem('user_points') || '0');
      resolve({ data: { streak: streaks.current, points } });
    }, 300);
  });
};

export default api;