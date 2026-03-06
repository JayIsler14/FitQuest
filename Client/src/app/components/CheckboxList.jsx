import React from 'react';

// DYNAMIC CHECKBOX LIST COMPONENT
// For database-driven onboarding steps
// Used for injuries, health conditions, allergies, dietary restrictions
// Renders unlimited scrollable items from database

const CheckboxList = ({ items, selected, onChange, title, description }) => {
  const handleToggle = (itemId) => {
    if (selected.includes(itemId)) {
      onChange(selected.filter(id => id !== itemId));
    } else {
      onChange([...selected, itemId]);
    }
  };

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold text-gray-800">{title}</h2>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      {/* Scrollable container for unlimited items */}
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => handleToggle(item.id)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-700">{item.name}</span>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {items.length === 0 && (
        <p className="text-gray-500 text-center py-8">No items available</p>
      )}
    </div>
  );
};

export default CheckboxList;
