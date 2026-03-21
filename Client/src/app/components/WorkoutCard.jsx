import React, { useState } from 'react';
import { Dumbbell, Info } from 'lucide-react';

const WorkoutCard = ({ exercise, onComplete, onRate }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [rating, setRating] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    if (onComplete) {
      onComplete(exercise.id, rating);
    }
  };

  const handleRating = (value) => {
    setRating(value);
    if (onRate) {
      onRate(exercise.id, value);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Dumbbell className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{exercise.name}</h3>
              <p className="text-sm text-gray-600">{exercise.muscleGroup}</p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Info size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Difficulty</p>
            <p className="font-medium text-gray-800">{exercise.difficulty}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Intensity</p>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-4 rounded ${
                    i < exercise.intensity ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Equipment</p>
            <p className="font-medium text-gray-800">{exercise.equipment}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Target</p>
            <p className="font-medium text-gray-800">
              {exercise.sets && `${exercise.sets} × ${exercise.reps}`}
              {exercise.duration && exercise.duration}
            </p>
          </div>
        </div>

        {/* Rating */}
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

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={completed}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            completed
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {completed ? '✓ Completed' : 'Mark Complete'}
        </button>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{exercise.name} Guide</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Form Tips</h3>
                <p className="text-gray-600">{exercise.formTips}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Common Mistakes</h3>
                <p className="text-gray-600">{exercise.commonMistakes}</p>
              </div>

              {exercise.videoLink && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Video Guide</h3>
                  <a
                    href={exercise.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Watch tutorial video →
                  </a>
                </div>
              )}
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
