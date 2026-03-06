import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

const MealCard = ({ meal, mealType }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <UtensilsCrossed className="text-green-600" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-600 uppercase tracking-wide">{mealType}</p>
          <h3 className="font-semibold text-lg text-gray-800">{meal.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Calories</p>
          <p className="text-xl font-bold text-gray-800">{meal.calories}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Protein</p>
          <p className="text-xl font-bold text-blue-600">{meal.protein}g</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Carbs</p>
          <p className="text-xl font-bold text-orange-600">{meal.carbs}g</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Fat</p>
          <p className="text-xl font-bold text-green-600">{meal.fat}g</p>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
