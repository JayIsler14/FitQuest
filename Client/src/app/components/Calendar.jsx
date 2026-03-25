import React from 'react';

const Calendar = ({ workoutLogs }) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create array of all days
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getWorkoutForDay = (day) => {
    if (!day) return null;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutLogs.find(log => log.date?.startsWith(dateStr));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {monthNames[currentMonth]} {currentYear}
      </h2>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const workout = getWorkoutForDay(day);
          const hasWorkout = !!workout;
          const rating = workout?.rating || 0;

          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg relative group ${
                !day
                  ? 'bg-transparent'
                  : hasWorkout
                  ? 'bg-green-100 text-green-800 font-semibold cursor-pointer hover:bg-green-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {day && (
                <>
                  <span>{day}</span>
                  {hasWorkout && rating > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white px-2 py-1 rounded shadow-lg text-xs">
                        Rating: {rating}/5
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 rounded"></div>
          <span className="text-gray-600">No workout</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
