import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

const MealCard = ({
  meal,
  mealType,
  onSwap,
  onSearch,
  onMarkAte,
  isEaten = false,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <UtensilsCrossed className="text-green-600" size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-600 uppercase tracking-wide">{mealType}</p>
          <h3 className="font-semibold text-lg text-gray-800">{meal?.name}</h3>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={onSwap}
          type="button"
          disabled={isLoading}
          className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
        >
          Swap
        </button>

        <button
          onClick={onSearch}
          type="button"
          disabled={isLoading}
          className="px-3 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200 disabled:opacity-50"
        >
          Search
        </button>

        <button
          onClick={onMarkAte}
          type="button"
          disabled={isLoading || isEaten}
          className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            isEaten
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {isEaten ? 'Marked Ate' : 'Mark Ate'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Calories</p>
          <p className="text-xl font-bold text-gray-800">{meal?.calories}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Protein</p>
          <p className="text-xl font-bold text-blue-600">{meal?.protein}g</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Carbs</p>
          <p className="text-xl font-bold text-orange-600">{meal?.carbs}g</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Fat</p>
          <p className="text-xl font-bold text-green-600">{meal?.fat}g</p>
        </div>
      </div>
    </div>
  );
};

export default MealCard;