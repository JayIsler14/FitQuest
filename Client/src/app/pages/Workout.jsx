import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToDashboard from '../components/BackToDashboard';
import WorkoutCard from '../components/WorkoutCard';
import { getWorkout, completeWorkout } from '../services/api';
import { toast } from 'sonner';

const Workout = () => {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);

  useEffect(() => {
    loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      // TODO: GET /workout
      // AI Server-Side:
      // - safetyFilter.js
      // - difficultyEngine.js
      // Uses:
      // - exercises table
      // - exercise_contraindications table
      const response = await getWorkout();
      setWorkout(response.data);
    } catch (error) {
      console.error('Failed to load workout:', error);
      toast.error('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (exerciseId, rating) => {
    setRatings({ ...ratings, [exerciseId]: rating });
  };

  const handleComplete = async (exerciseId, rating) => {
    setCompletedExercises([...completedExercises, exerciseId]);

    // Check if all exercises are completed
    if (completedExercises.length + 1 === workout.exercises.length) {
      try {
        // TODO: POST /workout/complete
        // Save to workout_logs
        // Update user_streaks
        // Update user_points
        // Update AI feedback modifier
        await completeWorkout({
          exercises: workout.exercises.map(ex => ({
            id: ex.id,
            rating: ratings[ex.id] || 0,
          })),
          ratings,
        });

        toast.success('🎉 Workout completed! +50 points earned');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error) {
        console.error('Failed to complete workout:', error);
        toast.error('Failed to save workout');
      }
    } else {
      toast.success('Exercise completed!');
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BackToDashboard />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Today's Workout</h1>
        <p className="text-gray-600">
          {workout?.exercises?.length || 0} exercises • AI-personalized for you
        </p>
      </div>

      {/* AI LOGIC IS SERVER-SIDE */}
      {/* workoutEngine.js handles safety filtering */}
      {/* difficultyEngine.js adapts difficulty */}
      {/* Plans regenerate if profile_change_version changes */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workout?.exercises?.map((exercise) => (
          <WorkoutCard
            key={exercise.id}
            exercise={exercise}
            onRate={handleRate}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-800">Progress</span>
          <span className="text-gray-600">
            {completedExercises.length} / {workout?.exercises?.length || 0} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${((completedExercises.length / (workout?.exercises?.length || 1)) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Workout;