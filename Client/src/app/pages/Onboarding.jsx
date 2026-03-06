import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowLeft, X } from 'lucide-react';
import CheckboxList from '../components/CheckboxList';
import {
  createUserProfile,
  updateUserProfile,
  saveUserInjuries,
  saveHealthConditions,
  saveAllergies,
  saveDietaryRestrictions,
  getInjuries,
  getHealthConditions,
  getAllergies,
  getDietaryRestrictions,
  getUserProfile,
  getUserInjuries,
  getUserHealthConditions,
  getUserAllergies,
  getUserDietaryRestrictions,
} from '../services/api';
import { toast } from 'sonner';

// DATABASE-DRIVEN ONBOARDING
// All lists (injuries, conditions, allergies, diet) come from database
// Steps 3-6 use dynamic CheckboxList component
// On submit: Increment profile_change_version to trigger AI plan regeneration
// EDIT MODE: Supports ?edit=true query parameter to load and modify existing data

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEditMode);

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    age: '',
    height: '',
    weight: '',
    goal: 'maintain',
  });

  // Validation errors for Step 1
  const [errors, setErrors] = useState({
    age: '',
    height: '',
    weight: '',
  });

  // Touched fields (for showing errors only after blur)
  const [touched, setTouched] = useState({
    age: false,
    height: false,
    weight: false,
  });

  const [experience, setExperience] = useState({
    level: 3,
    intensity: 3,
    weeklyAvailability: '3-4',
  });

  // Dynamic data from database
  const [availableInjuries, setAvailableInjuries] = useState([]);
  const [availableConditions, setAvailableConditions] = useState([]);
  const [availableAllergies, setAvailableAllergies] = useState([]);
  const [availableRestrictions, setAvailableRestrictions] = useState([]);

  // Selected IDs
  const [selectedInjuries, setSelectedInjuries] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

  const totalSteps = 6;

  // Load dynamic data on mount
  useEffect(() => {
    loadDynamicData();
  }, []);

  const loadDynamicData = async () => {
    try {
      // TODO: GET /injuries - Database: injuries table
      const injuriesRes = await getInjuries();
      setAvailableInjuries(injuriesRes.data);

      // TODO: GET /health-conditions - Database: health_conditions table
      const conditionsRes = await getHealthConditions();
      setAvailableConditions(conditionsRes.data);

      // TODO: GET /allergies - Database: allergies table
      const allergiesRes = await getAllergies();
      setAvailableAllergies(allergiesRes.data);

      // TODO: GET /dietary-restrictions - Database: dietary_restrictions table
      const restrictionsRes = await getDietaryRestrictions();
      setAvailableRestrictions(restrictionsRes.data);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  // Load existing user data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadUserData();
    }
  }, [isEditMode]);

  const loadUserData = async () => {
    try {
      // TODO: GET /api/user-profile
      // Database: user_profiles table
      // Load basic info and experience data
      const profileRes = await getUserProfile();
      setBasicInfo(profileRes.data);
      setExperience(profileRes.data);

      // TODO: GET /api/user-injuries
      // Database: user_injuries table (many-to-many join)
      // Returns array of injury objects with IDs
      const injuriesRes = await getUserInjuries();
      setSelectedInjuries(injuriesRes.data.map(injury => injury.id || injury));

      // TODO: GET /api/user-health-conditions
      // Database: user_health_conditions table (many-to-many join)
      // Returns array of condition objects with IDs
      const conditionsRes = await getUserHealthConditions();
      setSelectedConditions(conditionsRes.data.map(condition => condition.id || condition));

      // TODO: GET /api/user-allergies
      // Database: user_allergies table (many-to-many join)
      // Returns array of allergy objects with IDs
      const allergiesRes = await getUserAllergies();
      setSelectedAllergies(allergiesRes.data.map(allergy => allergy.id || allergy));

      // TODO: GET /api/user-dietary-restrictions
      // Database: user_dietary_restrictions table (many-to-many join)
      // Returns array of restriction objects with IDs
      const restrictionsRes = await getUserDietaryRestrictions();
      setSelectedRestrictions(restrictionsRes.data.map(restriction => restriction.id || restriction));
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Validation function for Step 1
  const validateField = (field, value) => {
    const trimmedValue = value.toString().trim();
    
    // Check if empty
    if (!trimmedValue) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    
    // Check if valid number
    const num = parseFloat(trimmedValue);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }
    
    // Field-specific validation with realistic ranges
    if (field === 'age') {
      if (num < 13) {
        return 'You must be at least 13 years old.';
      }
      if (num > 100) {
        return 'Please enter a valid age.';
      }
      // Check if whole number
      if (!Number.isInteger(num)) {
        return 'Age must be a whole number.';
      }
    }
    
    if (field === 'height') {
      if (num < 120) {
        return 'Height must be at least 120 cm.';
      }
      if (num > 250) {
        return 'Please enter a realistic height.';
      }
    }
    
    if (field === 'weight') {
      if (num < 35) {
        return 'Weight must be at least 35 kg.';
      }
      if (num > 300) {
        return 'Please enter a realistic weight.';
      }
    }
    
    return '';
  };

  // Validate all fields for Step 1
  const validateStep1 = () => {
    const newErrors = {
      age: validateField('age', basicInfo.age),
      height: validateField('height', basicInfo.height),
      weight: validateField('weight', basicInfo.weight),
    };
    
    setErrors(newErrors);
    
    // Return true if no errors
    return !newErrors.age && !newErrors.height && !newErrors.weight;
  };

  // Check if Step 1 is valid (for disabling button)
  const isStepOneValid = () => {
    const ageValue = basicInfo.age.toString().trim();
    const heightValue = basicInfo.height.toString().trim();
    const weightValue = basicInfo.weight.toString().trim();
    
    if (!ageValue || !heightValue || !weightValue) {
      return false;
    }
    
    const age = parseFloat(ageValue);
    const height = parseFloat(heightValue);
    const weight = parseFloat(weightValue);
    
    // Check if all are valid numbers
    if (isNaN(age) || isNaN(height) || isNaN(weight)) {
      return false;
    }
    
    // Check realistic ranges
    // Age: 13-100, must be whole number
    if (age < 13 || age > 100 || !Number.isInteger(age)) {
      return false;
    }
    
    // Height: 120-250 cm
    if (height < 120 || height > 250) {
      return false;
    }
    
    // Weight: 35-300 kg
    if (weight < 35 || weight > 300) {
      return false;
    }
    
    return true;
  };

  // Handle field change with validation
  const handleFieldChange = (field, value) => {
    setBasicInfo({ ...basicInfo, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  // Handle field blur
  const handleFieldBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, basicInfo[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleNext = () => {
    // Validate Step 1 before proceeding
    if (step === 1) {
      // Mark all fields as touched to show errors
      setTouched({ age: true, height: true, weight: true });
      
      if (!validateStep1()) {
        return; // Don't proceed if validation fails
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isEditMode) {
        // EDIT MODE: Update existing profile
        // TODO: PUT /api/user-profile
        // Database: user_profiles table
        // Backend logic:
        // - UPDATE user_profiles SET age = ?, height = ?, weight = ?, goal = ?, level = ?, intensity = ?, weekly_availability = ?, profile_change_version = profile_change_version + 1 WHERE user_id = ?
        // - Increment profile_change_version to trigger AI plan regeneration
        await updateUserProfile({ ...basicInfo, ...experience });

        // TODO: BEGIN TRANSACTION
        // DELETE existing many-to-many relationships and recreate them
        
        // TODO: DELETE FROM user_injuries WHERE user_id = ?
        // TODO: INSERT INTO user_injuries (user_id, injury_id) VALUES (?, ?) for each selected injury
        await saveUserInjuries(selectedInjuries);

        // TODO: DELETE FROM user_health_conditions WHERE user_id = ?
        // TODO: INSERT INTO user_health_conditions (user_id, condition_id) VALUES (?, ?) for each selected condition
        await saveHealthConditions(selectedConditions);

        // TODO: DELETE FROM user_allergies WHERE user_id = ?
        // TODO: INSERT INTO user_allergies (user_id, allergy_id) VALUES (?, ?) for each selected allergy
        await saveAllergies(selectedAllergies);

        // TODO: DELETE FROM user_dietary_restrictions WHERE user_id = ?
        // TODO: INSERT INTO user_dietary_restrictions (user_id, restriction_id) VALUES (?, ?) for each selected restriction
        await saveDietaryRestrictions(selectedRestrictions);

        // TODO: COMMIT TRANSACTION

        // TODO: Trigger AI plan regeneration
        // Backend should detect profile_change_version increment
        // - Mark existing generated_plans as outdated
        // - Queue workoutEngine.js and nutritionEngine.js for regeneration
        // - Consider user's updated injuries, conditions, allergies, and dietary restrictions
        
        toast.success('Preferences updated successfully!');
      } else {
        // NEW USER MODE: Create initial profile
        // TODO: POST /api/user-profile
        // Database: user_profiles
        // Set profile_change_version = 1
        await createUserProfile({ ...basicInfo, ...experience });

        // TODO: Save to user_injuries table (many-to-many relationship)
        await saveUserInjuries(selectedInjuries);

        // TODO: Save to user_health_conditions table
        await saveHealthConditions(selectedConditions);

        // TODO: Save to user_allergies table
        await saveAllergies(selectedAllergies);

        // TODO: Save to user_dietary_restrictions table
        await saveDietaryRestrictions(selectedRestrictions);

        // AI LOGIC IS SERVER-SIDE
        // After profile creation, backend will:
        // - Set profile_change_version = 1
        // - Trigger workoutEngine.js and nutritionEngine.js
        // - Generate initial plans in generated_plans table
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="13"
                max="100"
                step="1"
                value={basicInfo.age}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                onBlur={() => handleFieldBlur('age')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.age && errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your age"
              />
              {touched.age && errors.age ? (
                <p className="mt-1 text-sm text-red-500">{errors.age}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">Required</p>
              )}
            </div>

            {/* Height and Weight Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Height Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="120"
                  max="250"
                  step="0.1"
                  value={basicInfo.height}
                  onChange={(e) => handleFieldChange('height', e.target.value)}
                  onBlur={() => handleFieldBlur('height')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.height && errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="170"
                />
                {touched.height && errors.height ? (
                  <p className="mt-1 text-sm text-red-500">{errors.height}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Required</p>
                )}
              </div>

              {/* Weight Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="35"
                  max="300"
                  step="0.1"
                  value={basicInfo.weight}
                  onChange={(e) => handleFieldChange('weight', e.target.value)}
                  onBlur={() => handleFieldBlur('weight')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.weight && errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="70"
                />
                {touched.weight && errors.weight ? (
                  <p className="mt-1 text-sm text-red-500">{errors.weight}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Required</p>
                )}
              </div>
            </div>

            {/* Fitness Goal Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goal</label>
              <select
                value={basicInfo.goal}
                onChange={(e) => setBasicInfo({ ...basicInfo, goal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="loss">Weight Loss</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Muscle Gain</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Experience Level</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Experience Level: {experience.level}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={experience.level}
                onChange={(e) => setExperience({ ...experience, level: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Intensity: {experience.intensity}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={experience.intensity}
                onChange={(e) => setExperience({ ...experience, intensity: parseInt(e.target.value) })}
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
                value={experience.weeklyAvailability}
                onChange={(e) => setExperience({ ...experience, weeklyAvailability: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1-2">1-2 days per week</option>
                <option value="3-4">3-4 days per week</option>
                <option value="5-6">5-6 days per week</option>
                <option value="7">Every day</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <CheckboxList
            items={availableInjuries}
            selected={selectedInjuries}
            onChange={setSelectedInjuries}
            title="Previous Injuries"
            description="Select any injuries you've had (helps us create safer workouts)"
          />
        );

      case 4:
        return (
          <CheckboxList
            items={availableConditions}
            selected={selectedConditions}
            onChange={setSelectedConditions}
            title="Health Conditions"
            description="Select any conditions that apply to you"
          />
        );

      case 5:
        return (
          <CheckboxList
            items={availableAllergies}
            selected={selectedAllergies}
            onChange={setSelectedAllergies}
            title="Food Allergies"
            description="Select any allergies you have"
          />
        );

      case 6:
        return (
          <CheckboxList
            items={availableRestrictions}
            selected={selectedRestrictions}
            onChange={setSelectedRestrictions}
            title="Dietary Preferences"
            description="Select your dietary preferences"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">\n        {/* Top section with Cancel button for edit mode */}
        <div className="flex items-center justify-between mb-6">
          {/* Back to Dashboard button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </button>

          {/* Cancel button (edit mode only) */}
          {isEditMode && (
            <button
              onClick={() => {
                // IMPORTANT:
                // Only persist changes on final confirmation
                // Cancel must discard all unsaved edits
                navigate('/dashboard');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X size={18} />
              Cancel
            </button>
          )}
        </div>

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-blue-900">Editing Your Preferences</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-200 text-blue-800 rounded-full">
                      Previously Saved Preferences Loaded
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Changes will only be saved when you complete all steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {dataLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
            </div>
          ) : (
            renderStep()
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading || dataLoading || (step === 1 && !isStepOneValid())}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-colors ${
                loading || dataLoading || (step === 1 && !isStepOneValid())
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : step === totalSteps ? (isEditMode ? 'Save Changes' : 'Complete') : 'Next'}
              {!loading && step < totalSteps && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;