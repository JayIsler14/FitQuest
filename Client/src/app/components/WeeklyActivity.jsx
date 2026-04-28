import React, { useMemo } from 'react';

const WeeklyActivity = ({ logs = [] }) => {
  const weekData = useMemo(() => {
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      return {
        index,
        date,
        shortLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullLabel: date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        }),
        count: 0
      };
    });

    logs.forEach((log) => {
      const timestamp = log?.completed_at || log?.created_at;
      if (!timestamp) return;

      const logDate = new Date(timestamp);
      if (Number.isNaN(logDate.getTime())) return;

      const normalizedLogDate = new Date(logDate);
      normalizedLogDate.setHours(0, 0, 0, 0);

      const match = days.find(
        (dayItem) => dayItem.date.getTime() === normalizedLogDate.getTime()
      );

      if (match) {
        match.count += 1;
      }
    });

    return days;
  }, [logs]);

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);
  const chartMax = Math.max(maxCount, 4);

  const getBarHeightPercent = (count) => {
    if (count <= 0) return 8;
    return Math.max((count / chartMax) * 100, 12);
  };

  const getBarClass = (count) => {
    if (count === 0) {
      return 'bg-slate-200';
    }
    if (count === 1) {
      return 'bg-emerald-200';
    }
    if (count === 2) {
      return 'bg-emerald-300';
    }
    if (count === 3) {
      return 'bg-emerald-400';
    }
    return 'bg-emerald-500';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            This Week&apos;s Activity
          </p>
          <p className="text-xs text-slate-500">
            More workouts completed means a taller bar
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="h-3 w-3 rounded-sm bg-slate-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-300" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400" />
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 pt-4 pb-3">
        <div className="flex h-56 items-end gap-2 sm:gap-3">
          {weekData.map((day) => (
            <div
              key={day.index}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              <div className="relative flex h-full items-end">
                <div
                  title={`${day.fullLabel}: ${day.count} workout${day.count === 1 ? '' : 's'}`}
                  className={`w-full rounded-t-xl transition-all duration-200 hover:opacity-90 ${getBarClass(
                    day.count
                  )}`}
                  style={{ height: `${getBarHeightPercent(day.count)}%` }}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  <div className="font-medium">{day.fullLabel}</div>
                  <div className="text-slate-200">
                    {day.count} workout{day.count === 1 ? '' : 's'} completed
                  </div>
                </div>
              </div>

              <div className="pt-3 text-center text-xs font-medium text-slate-500">
                {day.shortLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyActivity;