import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToDashboard from '../components/BackToDashboard';
import WorkoutCard from '../components/WorkoutCard';
import { toast } from 'sonner';
import api, { getWorkout, submitWorkoutRating } from '../services/api';

const Workout = () => {
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [showRating, setShowRating] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      const response = await getWorkout();
      setWorkout(response.data);
    } catch (error) {
      console.error('Failed to load workout:', error);
      toast.error('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (exerciseId) => {
    const updatedCompleted = [...completedExercises, exerciseId];
    setCompletedExercises(updatedCompleted);

    if (!workout?.exercises) return;

    const day = workout.exercises.find(d =>
      d.exercises.some(ex => ex.id === exerciseId)
    );

    if (!day) return;

    const completedToday = day.exercises.filter(ex =>
      updatedCompleted.includes(ex.id)
    ).length;

    if (completedToday === day.exercises.length) {
      setCurrentDay(day.day);
      setShowRating(true);
      toast.success(`Day ${day.day} completed!`);
    } else {
      toast.success('Exercise completed!');
    }
  };

  const submitRating = async (rating) => {
    try {

      await submitWorkoutRating({
        rating: rating,
        day: currentDay
      });

      // regenerate plan based on difficulty feedback
      await loadWorkout();

      toast.success("Next workout unlocked 🔓");

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      toast.error("Failed to submit rating");
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

  const unlockedDay = workout?.unlockedDay;

  const today = workout?.exercises?.find(d => d.day === unlockedDay);

  const totalExercises = today?.exercises?.length || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <BackToDashboard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Today's Workout
        </h1>
        <p className="text-gray-600">
          {totalExercises} exercises • AI-personalized for you
        </p>
      </div>

      {today && (
        <div className="mb-10">

          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Day {today.day}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {today.exercises.map((exercise) => (
              <WorkoutCard
                key={exercise.id}
                exercise={exercise}
                onComplete={handleComplete}
              />
            ))}
          </div>

        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">

        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-800">Progress</span>
          <span className="text-gray-600">
            {completedExercises.length} / {totalExercises} completed
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${(completedExercises.length / totalExercises) * 100}%`,
            }}
          />
        </div>

      </div>

      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

          <div className="bg-white rounded-xl p-6 shadow-xl w-96 text-center">

            <h2 className="text-xl font-bold mb-2">
              Day {currentDay} Completed 🎉
            </h2>

            <p className="text-gray-600 mb-4">
              How difficult was this workout?
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
              Your future workouts will adapt based on this feedback.
            </p>

          </div>

        </div>
      )}

    </div>
  );
};

export default Workout;