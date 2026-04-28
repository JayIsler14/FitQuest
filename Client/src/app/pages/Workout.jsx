import React, { useState, useEffect, useMemo } from 'react';
import BackToDashboard from '../components/BackToDashboard';
import WorkoutCard from '../components/WorkoutCard';
import { toast } from 'sonner';
import {
  getWorkout,
  submitWorkoutRating,
  completeWorkout,
  getBonusWorkoutPack,
  swapWorkoutExercise,
  swapBonusWorkoutExercise
} from '../services/api';

const Workout = () => {
  const [workout, setWorkout] = useState(null);
  const [assignedDay, setAssignedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const [completedExercises, setCompletedExercises] = useState([]);
  const [showRating, setShowRating] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);
  const [completedToday, setCompletedToday] = useState(false);

  const [bonusPack, setBonusPack] = useState(null);
  const [completedBonusExercises, setCompletedBonusExercises] = useState([]);
  const [loadingBonus, setLoadingBonus] = useState(false);
  const [bonusPackNumber, setBonusPackNumber] = useState(1);

  const [dayKey, setDayKey] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const getUserKey = () => {
    try {
      const raw = localStorage.getItem('jwt_token');
      return raw || 'guest';
    } catch {
      return 'guest';
    }
  };

  const storageUserKey = getUserKey();

  const assignedCompleteStorageKey = useMemo(
    () => `fitquest_assigned_complete_${storageUserKey}_${dayKey}`,
    [storageUserKey, dayKey]
  );

  const bonusPackStorageKey = useMemo(
    () => `fitquest_bonus_pack_${storageUserKey}_${dayKey}`,
    [storageUserKey, dayKey]
  );

  const bonusCompletedStorageKey = useMemo(
    () => `fitquest_bonus_completed_${storageUserKey}_${dayKey}`,
    [storageUserKey, dayKey]
  );

  const getTodayDateString = () => new Date().toDateString();

  const isTodayLog = (log) => {
    const ts = log?.completed_at || log?.created_at;
    if (!ts) return false;
    return new Date(ts).toDateString() === getTodayDateString();
  };

  useEffect(() => {
    initializeWorkoutPage();
  }, [dayKey]);

  useEffect(() => {
    if (completedToday) {
      restoreOrLoadBonusPack();
    }
  }, [completedToday, dayKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newDayKey = new Date().toISOString().slice(0, 10);

      if (newDayKey !== dayKey) {
        setDayKey(newDayKey);
        setShowRating(false);
        setCurrentDay(null);
        setCompletedToday(false);
        setCompletedExercises([]);
        setAssignedDay(null);
        setBonusPack(null);
        setCompletedBonusExercises([]);
        setBonusPackNumber(1);
        window.dispatchEvent(new Event('stats-updated'));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dayKey]);

  const getWorkoutHistorySafe = async () => {
    try {
      const res = await fetchHistoryThroughApi();
      return res;
    } catch (err) {
      console.error('Failed to load workout history:', err);
      return [];
    }
  };

  const fetchHistoryThroughApi = async () => {
    const mod = await import('../services/api');
    const res = await mod.default.get('/workouts/history');
    return res.data?.logs || [];
  };

  const getStoredBonusPack = () => {
    try {
      const raw = localStorage.getItem(bonusPackStorageKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.exercises)) return null;

      return parsed;
    } catch (err) {
      console.error('Failed to read stored bonus pack:', err);
      return null;
    }
  };

  const saveBonusPackToStorage = (pack) => {
    try {
      localStorage.setItem(bonusPackStorageKey, JSON.stringify(pack));
    } catch (err) {
      console.error('Failed to save bonus pack:', err);
    }
  };

  const getStoredCompletedBonusIds = () => {
    try {
      const raw = localStorage.getItem(bonusCompletedStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to read stored completed bonus ids:', err);
      return [];
    }
  };

  const saveCompletedBonusIds = (ids) => {
    try {
      localStorage.setItem(
        bonusCompletedStorageKey,
        JSON.stringify([...new Set(ids)])
      );
    } catch (err) {
      console.error('Failed to save completed bonus ids:', err);
    }
  };

  const saveAssignedComplete = (value) => {
    try {
      localStorage.setItem(
        assignedCompleteStorageKey,
        value ? 'true' : 'false'
      );
    } catch (err) {
      console.error('Failed to save assigned complete flag:', err);
    }
  };

  const clearStoredBonusState = () => {
    try {
      localStorage.removeItem(bonusPackStorageKey);
      localStorage.removeItem(bonusCompletedStorageKey);
    } catch (err) {
      console.error('Failed to clear stored bonus state:', err);
    }
  };

  const initializeWorkoutPage = async () => {
    try {
      setLoading(true);

      const [workoutRes, historyRes] = await Promise.all([
        getWorkout(),
        getWorkoutHistorySafe()
      ]);

      const workoutData = workoutRes.data || {};
      const historyLogs = historyRes || [];

      setWorkout(workoutData);

      const assignedDayFromWorkout =
        workoutData?.currentWorkoutDay ||
        workoutData?.displayWorkoutDay ||
        workoutData?.exercises?.find(
          (day) => Number(day.day) === Number(workoutData?.displayDay)
        ) ||
        workoutData?.exercises?.find(
          (day) => Number(day.day) === Number(workoutData?.unlockedDay)
        ) ||
        null;

      setAssignedDay(assignedDayFromWorkout);

      const assignedExerciseIds = (assignedDayFromWorkout?.exercises || []).map(
        (ex) => ex.id
      );

      const allCompletedTodayIds = historyLogs
        .filter((log) => isTodayLog(log) && log.exercise_id != null)
        .map((log) => log.exercise_id);

      const uniqueCompletedTodayIds = [...new Set(allCompletedTodayIds)];
      setCompletedExercises(uniqueCompletedTodayIds);

      const completedAssignedTodayCount = uniqueCompletedTodayIds.filter((id) =>
        assignedExerciseIds.includes(id)
      ).length;

      const localAssignedComplete =
        localStorage.getItem(assignedCompleteStorageKey) === 'true';

      const completedFlag =
        (assignedExerciseIds.length > 0 &&
          completedAssignedTodayCount === assignedExerciseIds.length) ||
        !!workoutData.completedToday ||
        !!workoutData.dayCompleted ||
        !!workoutData.assignedCompleted ||
        localAssignedComplete;

      setCompletedToday(completedFlag);

      if (!completedFlag) {
        setBonusPack(null);
        setCompletedBonusExercises([]);
        setBonusPackNumber(1);
      }

      if (completedFlag) {
        await restoreOrLoadBonusPack();
      }
    } catch (err) {
      console.error('Failed to initialize workout page:', err);
      toast.error('Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const restoreOrLoadBonusPack = async () => {
    try {
      setLoadingBonus(true);

      const storedPack = getStoredBonusPack();

      if (storedPack?.exercises?.length) {
        const storedIds = getStoredCompletedBonusIds();
        const validPackIds = storedPack.exercises.map((exercise) => exercise.id);
        const filtered = storedIds.filter((id) => validPackIds.includes(id));

        setBonusPack(storedPack);
        setBonusPackNumber(storedPack.packNumber || 1);
        setCompletedBonusExercises(filtered);
        saveCompletedBonusIds(filtered);
        return;
      }

      const res = await getBonusWorkoutPack();
      const newPack = {
        ...res.data,
        packNumber: 1,
        savedForDate: dayKey
      };

      setBonusPack(newPack);
      setBonusPackNumber(1);
      setCompletedBonusExercises([]);
      saveBonusPackToStorage(newPack);
      saveCompletedBonusIds([]);
    } catch (err) {
      console.error('Failed to restore/load bonus pack:', err);
      toast.error('Failed to load bonus workouts');
    } finally {
      setLoadingBonus(false);
    }
  };

  const loadNewBonusPack = async () => {
    try {
      setLoadingBonus(true);

      const res = await getBonusWorkoutPack();
      const nextPackNumber = (bonusPackNumber || 1) + 1;

      const newPack = {
        ...res.data,
        packNumber: nextPackNumber,
        savedForDate: dayKey
      };

      setBonusPack(newPack);
      setBonusPackNumber(nextPackNumber);
      setCompletedBonusExercises([]);

      saveBonusPackToStorage(newPack);
      saveCompletedBonusIds([]);
    } catch (err) {
      console.error('Failed to load new bonus pack:', err);
      toast.error('Failed to load new bonus workout');
    } finally {
      setLoadingBonus(false);
    }
  };

  const handleSwapAssignedExercise = async (
    exerciseId,
    workoutDayNumber,
    slotIndex
  ) => {
    try {
      if (!assignedDay?.exercises?.length) return;

      const excludeExerciseIds = assignedDay.exercises.map((ex) => ex.id);

      const res = await swapWorkoutExercise({
        currentExerciseId: exerciseId,
        excludeExerciseIds,
        workoutDay: workoutDayNumber,
        slotIndex
      });

      const replacement = res.data?.exercise;

      if (!replacement) {
        toast.error('No replacement exercise found');
        return;
      }

      setAssignedDay((prev) => {
        if (!prev) return prev;

        const nextExercises = [...(prev.exercises || [])];
        nextExercises[slotIndex] = replacement;

        return {
          ...prev,
          exercises: nextExercises
        };
      });

      setWorkout((prev) => {
        if (!prev?.exercises) return prev;

        return {
          ...prev,
          exercises: prev.exercises.map((day) => {
            if (Number(day.day) !== Number(workoutDayNumber)) {
              return day;
            }

            const nextExercises = [...(day.exercises || [])];
            nextExercises[slotIndex] = replacement;

            return {
              ...day,
              exercises: nextExercises
            };
          }),
          currentWorkoutDay:
            prev.currentWorkoutDay &&
            Number(prev.currentWorkoutDay.day) === Number(workoutDayNumber)
              ? {
                  ...prev.currentWorkoutDay,
                  exercises: prev.currentWorkoutDay.exercises.map((ex, idx) =>
                    idx === slotIndex ? replacement : ex
                  )
                }
              : prev.currentWorkoutDay
        };
      });

      setCompletedExercises((prev) => prev.filter((id) => id !== exerciseId));
      toast.success('Exercise swapped');
    } catch (err) {
      console.error('Failed to swap exercise:', err);
      toast.error(err.response?.data?.error || 'Failed to swap exercise');
    }
  };

  const handleSwapBonusExercise = async (exerciseId) => {
    try {
      if (!bonusPack?.exercises?.length) return;

      if (completedBonusExercises.includes(exerciseId)) {
        toast.error('Completed bonus workouts cannot be swapped');
        return;
      }

      const excludeExerciseIds = bonusPack.exercises.map((ex) => ex.id);

      const res = await swapBonusWorkoutExercise({
        currentExerciseId: exerciseId,
        excludeExerciseIds
      });

      const replacement = res.data?.exercise;

      if (!replacement) {
        toast.error('No replacement exercise found');
        return;
      }

      const updatedPack = {
        ...bonusPack,
        exercises: bonusPack.exercises.map((exercise) =>
          exercise.id === exerciseId ? replacement : exercise
        )
      };

      setBonusPack(updatedPack);
      saveBonusPackToStorage(updatedPack);
      toast.success('Bonus exercise swapped');
    } catch (err) {
      console.error('Failed to swap bonus exercise:', err);
      toast.error(err.response?.data?.error || 'Failed to swap bonus exercise');
    }
  };

  const handleMainComplete = async (exerciseId) => {
    try {
      await completeWorkout({
        exercise_id: exerciseId,
        duration_minutes: 15
      });

      const updatedCompleted = [...new Set([...completedExercises, exerciseId])];
      setCompletedExercises(updatedCompleted);
      window.dispatchEvent(new Event('stats-updated'));

      if (!assignedDay) {
        toast.success('Workout logged!');
        return;
      }

      const assignedExerciseIds = (assignedDay.exercises || []).map(
        (ex) => ex.id
      );
      const uniqueCompletedAssigned = updatedCompleted.filter((id) =>
        assignedExerciseIds.includes(id)
      );

      if (uniqueCompletedAssigned.length === assignedExerciseIds.length) {
        setCurrentDay(assignedDay.day);
        setShowRating(true);
        toast.success(`Day ${assignedDay.day} completed!`);
      } else {
        toast.success('Exercise completed!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log workout');
    }
  };

  const handleBonusComplete = async (exerciseId) => {
    try {
      await completeWorkout({
        exercise_id: exerciseId,
        duration_minutes: 15
      });

      const updated = [...new Set([...completedBonusExercises, exerciseId])];
      setCompletedBonusExercises(updated);
      saveCompletedBonusIds(updated);
      window.dispatchEvent(new Event('stats-updated'));

      const totalBonus = bonusPack?.exercises?.length || 0;

      if (updated.length === totalBonus) {
        toast.success('Bonus workout pack completed!');
      } else {
        toast.success('Bonus workout logged!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log bonus workout');
    }
  };

  const submitRating = async (rating) => {
    try {
      await submitWorkoutRating({
        rating,
        day: currentDay
      });

      saveAssignedComplete(true);
      setShowRating(false);
      setCompletedToday(true);

      await initializeWorkoutPage();
      window.dispatchEvent(new Event('stats-updated'));

      toast.success('Assigned workout saved');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workout...</p>
        </div>
      </div>
    );
  }

  const assignedExerciseIds = (assignedDay?.exercises || []).map((ex) => ex.id);

  const assignedCompletedCount = [...new Set(completedExercises)].filter((id) =>
    assignedExerciseIds.includes(id)
  ).length;

  const totalAssignedExercises = assignedExerciseIds.length;

  const progressPercent =
    totalAssignedExercises > 0
      ? (assignedCompletedCount / totalAssignedExercises) * 100
      : 0;

  const totalBonusExercises = bonusPack?.exercises?.length || 0;

  const completedBonusCount = [...new Set(completedBonusExercises)].filter(
    (id) =>
      (bonusPack?.exercises || []).some((exercise) => exercise.id === id)
  ).length;

  const bonusPackFinished =
    totalBonusExercises > 0 && completedBonusCount === totalBonusExercises;

  const bonusProgressPercent =
    totalBonusExercises > 0
      ? (completedBonusCount / totalBonusExercises) * 100
      : 0;

  return (
    <div className="w-full p-6">
      <BackToDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Today&apos;s Workout
        </h1>
        <p className="text-gray-600">
          Complete your assigned 3 workouts first, then keep going with bonus
          workouts.
        </p>
      </div>

      {!completedToday && assignedDay && (
        <>
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-800">
                Assigned Day Progress
              </span>
              <span className="text-gray-600">
                {assignedCompletedCount} / {totalAssignedExercises} completed
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Assigned Workouts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(assignedDay.exercises || []).map((exercise, index) => (
                <WorkoutCard
                  key={`main-${assignedDay.day}-${index}-${exercise.id}`}
                  exercise={exercise}
                  onComplete={handleMainComplete}
                  onSwap={(exerciseId) =>
                    handleSwapAssignedExercise(
                      exerciseId,
                      assignedDay.day,
                      index
                    )
                  }
                  swapDisabled={completedExercises.includes(exercise.id)}
                  completed={completedExercises.includes(exercise.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {!completedToday && !assignedDay && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No workout available
          </h2>
          <p className="text-gray-600">
            The app could not find an unlocked workout day in the current plan.
          </p>
        </div>
      )}

      {completedToday && (
        <>
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Assigned workout complete ✅
            </h2>
            <p className="text-gray-600">
              Your streak and daily progression are already counted for today.
              You can now keep doing bonus workouts for extra points.
            </p>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-700">
                Bonus Workouts
              </h2>

              {bonusPackFinished && (
                <button
                  onClick={async () => {
                    clearStoredBonusState();
                    await loadNewBonusPack();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  New Workout
                </button>
              )}
            </div>

            {loadingBonus && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600">Loading bonus workouts...</p>
              </div>
            )}

            {!loadingBonus && bonusPack?.exercises?.length > 0 && (
              <>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-800">
                      Bonus Pack Progress
                    </span>
                    <span className="text-gray-600">
                      {completedBonusCount} / {totalBonusExercises} completed
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${bonusProgressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bonusPack.exercises.map((exercise) => (
                    <WorkoutCard
                      key={`bonus-${bonusPackNumber}-${exercise.id}`}
                      exercise={exercise}
                      onComplete={handleBonusComplete}
                      onSwap={handleSwapBonusExercise}
                      completeLabel="Complete Bonus Workout"
                      completed={completedBonusExercises.includes(exercise.id)}
                      swapDisabled={completedBonusExercises.includes(exercise.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {!loadingBonus && (!bonusPack || !bonusPack.exercises?.length) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600">No bonus workouts available yet.</p>
              </div>
            )}
          </div>
        </>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl w-96 text-center">
            <h2 className="text-xl font-bold mb-2">
              Day {currentDay} Completed 🎉
            </h2>

            <p className="text-gray-600 mb-4">
              How difficult was this assigned workout?
            </p>

            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => submitRating(num)}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {num}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              Bonus workouts do not affect streak or progression.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workout;