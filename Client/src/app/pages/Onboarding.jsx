import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowLeft, X } from 'lucide-react';
import CheckboxList from '../components/CheckboxList';
import {
  createUserProfile,
  updateUserProfile,
  getInjuries,
  getHealthConditions,
  getAllergies,
  getDietaryRestrictions,
  getUserProfile,
  getUserInjuries,
  getUserHealthConditions,
  getUserAllergies,
  getUserDietaryRestrictions,
  generateFullPlan,
} from '../services/api';
import { toast } from 'sonner';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEditMode);

  const [basicInfo, setBasicInfo] = useState({
    age: '',
    height: '',
    weight: '',
    goal: 'maintain',
  });

  const [errors, setErrors] = useState({
    age: '',
    height: '',
    weight: '',
  });

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

  const [availableInjuries, setAvailableInjuries] = useState([]);
  const [availableConditions, setAvailableConditions] = useState([]);
  const [availableAllergies, setAvailableAllergies] = useState([]);
  const [availableRestrictions, setAvailableRestrictions] = useState([]);

  const [selectedInjuries, setSelectedInjuries] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

  const totalSteps = 6;

  useEffect(() => {
    loadDynamicData();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadUserData();
    }
  }, [isEditMode]);

  const loadDynamicData = async () => {
    try {
      const injuriesRes = await getInjuries();
      setAvailableInjuries(injuriesRes.data || []);

      const conditionsRes = await getHealthConditions();
      setAvailableConditions(conditionsRes.data || []);

      const allergiesRes = await getAllergies();
      setAvailableAllergies(allergiesRes.data || []);

      const restrictionsRes = await getDietaryRestrictions();
      setAvailableRestrictions(restrictionsRes.data || []);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      toast.error('Failed to load onboarding options.');
    }
  };

  const normalizeSelectedIds = (items) =>
    Array.isArray(items)
      ? items
          .map((item) =>
            typeof item === 'object'
              ? item?.id ??
                item?.injury_id ??
                item?.condition_id ??
                item?.allergy_id ??
                item?.restriction_id
              : item
          )
          .filter((value) => value !== undefined && value !== null)
      : [];

  const loadUserData = async () => {
    try {
      const profileRes = await getUserProfile();
      const profileData = profileRes.data || {};

      setBasicInfo({
        age: profileData.age ?? '',
        height: profileData.height ?? '',
        weight: profileData.weight ?? '',
        goal: profileData.goal ?? 'maintain',
      });

      setExperience({
        level: profileData.level ?? 3,
        intensity: profileData.intensity ?? 3,
        weeklyAvailability:
          profileData.weeklyAvailability ??
          profileData.weekly_availability ??
          '3-4',
      });

      const [injuriesRes, conditionsRes, allergiesRes, restrictionsRes] =
        await Promise.all([
          getUserInjuries(),
          getUserHealthConditions(),
          getUserAllergies(),
          getUserDietaryRestrictions(),
        ]);

      setSelectedInjuries(normalizeSelectedIds(injuriesRes.data));
      setSelectedConditions(normalizeSelectedIds(conditionsRes.data));
      setSelectedAllergies(normalizeSelectedIds(allergiesRes.data));
      setSelectedRestrictions(normalizeSelectedIds(restrictionsRes.data));
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load saved preferences.');
    } finally {
      setDataLoading(false);
    }
  };

  const validateField = (field, value) => {
    const trimmed = value?.toString().trim();

    if (!trimmed) {
      return 'This field is required.';
    }

    const num = parseFloat(trimmed);

    if (isNaN(num)) {
      return 'Please enter a valid number.';
    }

    if (field === 'age') {
      if (!Number.isInteger(num)) {
        return 'Age must be a whole number.';
      }
      if (num < 13) {
        return 'You must be at least 13 years old.';
      }
      if (num > 100) {
        return 'Please enter a realistic age.';
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

  const validateStep1 = () => {
    const newErrors = {
      age: validateField('age', basicInfo.age),
      height: validateField('height', basicInfo.height),
      weight: validateField('weight', basicInfo.weight),
    };

    setErrors(newErrors);
    return !newErrors.age && !newErrors.height && !newErrors.weight;
  };

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

    if (isNaN(age) || isNaN(height) || isNaN(weight)) {
      return false;
    }

    if (age < 13 || age > 100 || !Number.isInteger(age)) {
      return false;
    }

    if (height < 120 || height > 250) {
      return false;
    }

    if (weight < 35 || weight > 300) {
      return false;
    }

    return true;
  };

  const handleFieldChange = (field, value) => {
    setBasicInfo({ ...basicInfo, [field]: value });

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleFieldBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, basicInfo[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleNext = () => {
    if (step === 1) {
      setTouched({ age: true, height: true, weight: true });

      if (!validateStep1()) {
        return;
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
      const payload = {
        age: basicInfo.age === '' ? null : Number(basicInfo.age),
        height: basicInfo.height === '' ? null : Number(basicInfo.height),
        weight: basicInfo.weight === '' ? null : Number(basicInfo.weight),
        goal: basicInfo.goal,
        level: Number(experience.level),
        intensity: Number(experience.intensity),
        weeklyAvailability: experience.weeklyAvailability,
        injuries: selectedInjuries,
        allergies: selectedAllergies,
        healthConditions: selectedConditions,
        dietaryRestrictions: selectedRestrictions,
      };

      if (isEditMode) {
        await updateUserProfile(payload);

        try {
          await generateFullPlan();
        } catch (planError) {
          console.warn(
            'Plan pre-generation failed, plan will regenerate on next fetch:',
            planError
          );
        }

        toast.success('Preferences updated successfully!');
      } else {
        await createUserProfile(payload);
      }

      window.dispatchEvent(new Event('profile-updated'));
      window.dispatchEvent(new Event('workout-plan-updated'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  const stepTitle = (() => {
    switch (step) {
      case 1:
        return 'Tell us about yourself';
      case 2:
        return 'Set your workout preferences';
      case 3:
        return 'Do you have any injuries?';
      case 4:
        return 'Any health conditions?';
      case 5:
        return 'Any allergies?';
      case 6:
        return 'Any dietary restrictions?';
      default:
        return 'Onboarding';
    }
  })();

  const stepDescription = (() => {
    switch (step) {
      case 1:
        return 'We will use this to personalize your workout and meal plans.';
      case 2:
        return 'Choose the workout style and schedule that fits you best.';
      case 3:
        return 'We will avoid exercises that could aggravate injuries you select.';
      case 4:
        return 'These help us keep your plan safer and more appropriate.';
      case 5:
        return 'We will use this when building your meal recommendations.';
      case 6:
        return 'We will tailor meals around the restrictions you choose.';
      default:
        return '';
    }
  })();

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="w-full max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={basicInfo.age}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                onBlur={() => handleFieldBlur('age')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.age && errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="25"
              />
              {touched.age && errors.age ? (
                <p className="mt-1 text-sm text-red-500">{errors.age}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">Required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={basicInfo.height}
                onChange={(e) => handleFieldChange('height', e.target.value)}
                onBlur={() => handleFieldBlur('height')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.height && errors.height ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="175"
              />
              {touched.height && errors.height ? (
                <p className="mt-1 text-sm text-red-500">{errors.height}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">Required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
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

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Goal
            </label>
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
    }

    if (step === 2) {
      return (
        <div className="w-full max-w-2xl">
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Experience Level: {experience.level}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={experience.level}
                onChange={(e) =>
                  setExperience({
                    ...experience,
                    level: parseInt(e.target.value, 10),
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
                Preferred Intensity: {experience.intensity}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={experience.intensity}
                onChange={(e) =>
                  setExperience({
                    ...experience,
                    intensity: parseInt(e.target.value, 10),
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
                value={experience.weeklyAvailability}
                onChange={(e) =>
                  setExperience({
                    ...experience,
                    weeklyAvailability: e.target.value,
                  })
                }
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
      );
    }

    if (step === 3) {
      return (
        <div className="h-full min-h-0">
          <CheckboxList
            items={availableInjuries}
            selected={selectedInjuries}
            onChange={setSelectedInjuries}
          />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="h-full min-h-0">
          <CheckboxList
            items={availableConditions}
            selected={selectedConditions}
            onChange={setSelectedConditions}
          />
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="h-full min-h-0">
          <CheckboxList
            items={availableAllergies}
            selected={selectedAllergies}
            onChange={setSelectedAllergies}
          />
        </div>
      );
    }

    return (
      <div className="h-full min-h-0">
        <CheckboxList
          items={availableRestrictions}
          selected={selectedRestrictions}
          onChange={setSelectedRestrictions}
        />
      </div>
    );
  };

  const isCheckboxStep = step >= 3;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-3xl mx-auto h-full px-4 pt-6 pb-4 flex flex-col">
        <div className="mb-4 shrink-0">
          {isEditMode ? (
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <X size={18} />
              Cancel
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-[640px] max-h-full flex flex-col">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-blue-600 font-semibold mb-1">
                  {isEditMode ? 'Edit Preferences' : 'Welcome to FitQuest'}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{stepTitle}</h1>
                <p className="text-gray-600 mt-2">{stepDescription}</p>
              </div>

              <div className="text-sm text-gray-500 font-medium shrink-0">
                Step {step} of {totalSteps}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {isCheckboxStep ? (
              <div className="h-full min-h-0 p-6">
                {renderStepContent()}
              </div>
            ) : (
              <div className="h-full px-6 py-8 flex items-start justify-center">
                {renderStepContent()}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading || (step === 1 && !isStepOneValid())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : step === totalSteps ? 'Save Preferences' : 'Next'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;