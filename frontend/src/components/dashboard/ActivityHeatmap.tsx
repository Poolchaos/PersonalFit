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

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ActivityHeatmapProps {
  sessions: Array<{
    date: string;
    duration: number;
    exercises_completed: number;
  }>;
  weeksToShow?: number;
}

interface DayData {
  date: string;
  count: number;
  intensity: number; // 0-4
}

export function ActivityHeatmap({ sessions, weeksToShow = 12 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeksToShow * 7 - 1));

    // Create array of all days
    const days: DayData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const sessionForDay = sessions.filter(s => s.date.startsWith(dateStr));
      const count = sessionForDay.length;

      // Calculate intensity (0-4) based on session count
      let intensity = 0;
      if (count === 1) intensity = 1;
      else if (count === 2) intensity = 2;
      else if (count === 3) intensity = 3;
      else if (count >= 4) intensity = 4;

      days.push({
        date: dateStr,
        count,
        intensity,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [sessions, weeksToShow]);

  const weeks = useMemo(() => {
    const weeksArray: DayData[][] = [];
    let currentWeek: DayData[] = [];

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days as final week
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [heatmapData]);

  const getColor = (intensity: number) => {
    const colors = [
      'bg-neutral-100', // 0 - no activity
      'bg-primary-200', // 1 - light
      'bg-primary-400', // 2 - medium
      'bg-primary-600', // 3 - high
      'bg-primary-800', // 4 - very high
    ];
    return colors[intensity];
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        Activity Heatmap
      </h3>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-neutral-500 pr-2">
          {dayLabels.map((label, i) => (
            <div key={label} className="h-3 flex items-center">
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  whileHover={{ scale: 1.2 }}
                  className={`w-3 h-3 rounded-sm ${getColor(day.intensity)} cursor-pointer`}
                  title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-neutral-600">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((intensity) => (
          <div key={intensity} className={`w-3 h-3 rounded-sm ${getColor(intensity)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
