import React, { useState } from 'react';
import { Dumbbell, Info, RefreshCw } from 'lucide-react';

const WorkoutCard = ({
  exercise,
  onComplete,
  onRate,
  onSwap,
  completeLabel = 'Mark Complete',
  completed = false,
  swapDisabled = false
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [rating, setRating] = useState(0);
  const [swapping, setSwapping] = useState(false);

  const handleComplete = async () => {
    if (completed) return;

    if (onComplete) {
      await onComplete(exercise.id, rating);
    }
  };

  const handleRating = (value) => {
    setRating(value);

    if (onRate) {
      onRate(exercise.id, value);
    }
  };

  const handleSwap = async () => {
    if (completed || swapDisabled || !onSwap) return;

    try {
      setSwapping(true);
      await onSwap(exercise.id);
    } finally {
      setSwapping(false);
    }
  };

  const tutorialLink =
    exercise.exercise_link ||
    exercise.workout_link ||
    exercise.video_link ||
    exercise.exerciseLink ||
    exercise.workoutLink ||
    exercise.videoLink ||
    '';

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
              <Dumbbell className="text-blue-600" size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-800 leading-tight">
                {exercise.name}
              </h3>
              <p className="text-sm text-gray-600 leading-tight mt-1">
                {exercise.muscle_group || exercise.muscleGroup || 'Not listed'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <Info size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-600">Difficulty</p>
            <p className="font-medium text-gray-800 mt-0.5">
              {exercise.difficulty}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Muscle Group</p>
            <p className="font-medium text-gray-800 mt-0.5">
              {exercise.muscle_group || exercise.muscleGroup || 'Not listed'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Rate difficulty (1-5):</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  star <= rating
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {star}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleSwap}
            disabled={completed || swapDisabled || swapping}
            className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              completed || swapDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw size={16} className={swapping ? 'animate-spin' : ''} />
            {swapping ? 'Swapping...' : 'Swap Exercise'}
          </button>

          <button
            onClick={handleComplete}
            disabled={completed}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              completed
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {completed ? '✓ Completed' : completeLabel}
          </button>
        </div>
      </div>

      {showGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {exercise.name} Guide
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  How to Perform Exercise:
                </h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {exercise.exercise_description ||
                    exercise.exerciseDescription ||
                    'No exercise description available.'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Here&apos;s a Tutorial:
                </h3>

                {tutorialLink ? (
                  <a
                    href={tutorialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-blue-600 hover:text-blue-700 hover:underline break-all"
                  >
                    Open tutorial for this exercise →
                  </a>
                ) : (
                  <p className="text-gray-600">No tutorial link available.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkoutCard;