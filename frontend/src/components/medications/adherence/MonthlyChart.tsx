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

interface MonthlyChartProps {
  monthlyAdherence: DailyAdherence[];
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ monthlyAdherence }) => {
  const maxPercentage = 100;
  const chartHeight = 120;

  // Get the last 30 days
  const data = monthlyAdherence.slice(-30);

  // Calculate average
  const daysWithData = data.filter((d) => d.total > 0);
  const average =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((sum, d) => sum + d.percentage, 0) / daysWithData.length
        )
      : 0;

  const getBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-400 dark:bg-green-500';
    if (percentage >= 50) return 'bg-yellow-400 dark:bg-yellow-500';
    return 'bg-red-400 dark:bg-red-500';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Trend
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {average}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            30-day average
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400 py-1">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* Chart area */}
        <div className="ml-10">
          {/* Grid lines */}
          <div className="absolute left-10 right-0" style={{ height: chartHeight }}>
            <div className="absolute w-full h-px bg-gray-200 dark:bg-gray-700" style={{ top: 0 }} />
            <div className="absolute w-full h-px bg-gray-200 dark:bg-gray-700" style={{ top: '50%' }} />
            <div className="absolute w-full h-px bg-gray-200 dark:bg-gray-700" style={{ bottom: 0 }} />
          </div>

          {/* Bars */}
          <div
            className="flex items-end gap-[2px]"
            style={{ height: chartHeight }}
          >
            {data.map((day) => {
              const barHeight = day.total > 0
                ? (day.percentage / maxPercentage) * chartHeight
                : 4;

              return (
                <div
                  key={day.date}
                  className="flex-1 relative group"
                  style={{ minWidth: '6px' }}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      day.total > 0 ? getBarColor(day.percentage) : 'bg-gray-200 dark:bg-gray-600'
                    } hover:opacity-80`}
                    style={{ height: `${barHeight}px` }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div className="font-medium">{formatDate(day.date)}</div>
                      {day.total > 0 ? (
                        <>
                          <div>{day.percentage}% adherence</div>
                          <div className="text-gray-400">
                            {day.taken}/{day.total} taken
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400">No doses scheduled</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatDate(data[0]?.date || '')}</span>
            <span>{formatDate(data[Math.floor(data.length / 2)]?.date || '')}</span>
            <span>{formatDate(data[data.length - 1]?.date || '')}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {daysWithData.filter((d) => d.percentage >= 80).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Perfect days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
            {daysWithData.filter((d) => d.percentage >= 50 && d.percentage < 80).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Partial days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {daysWithData.filter((d) => d.percentage < 50).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Missed days</div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyChart;
