/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of PersonalFit.
 *
 * PersonalFit is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import React from 'react';
import type { DailyAdherence } from '../../../types';

interface WeeklyCalendarProps {
  weeklyAdherence: DailyAdherence[];
  onDayClick?: (date: string) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  weeklyAdherence,
  onDayClick,
}) => {
  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNumber = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  const getStatusColor = (day: DailyAdherence): string => {
    if (day.total === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (day.percentage >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (day.percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getStatusBorder = (day: DailyAdherence): string => {
    if (day.total === 0) return 'border-gray-200 dark:border-gray-600';
    if (day.percentage >= 80) return 'border-green-400 dark:border-green-500';
    if (day.percentage >= 50) return 'border-yellow-400 dark:border-yellow-500';
    return 'border-red-400 dark:border-red-500';
  };

  const getStatusEmoji = (day: DailyAdherence): string => {
    if (day.total === 0) return '—';
    if (day.percentage >= 80) return '✓';
    if (day.percentage >= 50) return '~';
    return '✗';
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        This Week
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {weeklyAdherence.map((day) => (
          <button
            key={day.date}
            onClick={() => onDayClick?.(day.date)}
            className={`
              flex flex-col items-center p-2 rounded-lg border-2 transition-all
              ${getStatusColor(day)}
              ${getStatusBorder(day)}
              ${isToday(day.date) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
              ${onDayClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getDayName(day.date)}
            </span>
            <span className={`text-lg font-bold ${isToday(day.date) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
              {getDayNumber(day.date)}
            </span>
            <span className="text-lg">
              {getStatusEmoji(day)}
            </span>
            {day.total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {day.taken}/{day.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-400" />
          <span>≥80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400" />
          <span>50-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-400" />
          <span>&lt;50%</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
