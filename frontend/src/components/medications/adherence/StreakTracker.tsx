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
import type { AdherenceStreak } from '../../../types';

interface StreakTrackerProps {
  streak: AdherenceStreak;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ streak }) => {
  const { current, longest, lastPerfectDay } = streak;

  const getStreakColor = (streakDays: number): string => {
    if (streakDays >= 14) return 'text-green-500';
    if (streakDays >= 7) return 'text-yellow-500';
    if (streakDays >= 3) return 'text-orange-500';
    return 'text-gray-400';
  };

  const getFireEmojis = (streakDays: number): string => {
    if (streakDays >= 30) return '🔥🔥🔥';
    if (streakDays >= 14) return '🔥🔥';
    if (streakDays >= 7) return '🔥';
    return '';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Streak Tracker
      </h3>

      <div className="flex items-center justify-between mb-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getStreakColor(current)}`}>
            {current}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Current {getFireEmojis(current)}
          </div>
        </div>

        {/* Divider */}
        <div className="h-16 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Longest Streak */}
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-500">
            {longest}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Longest 🏆
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress to next milestone</span>
          <span>
            {current % 7}/{7} days
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((current % 7) / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Last Perfect Day */}
      <div className="text-sm text-gray-600 dark:text-gray-300">
        <span className="text-gray-500 dark:text-gray-400">Last perfect day: </span>
        <span className="font-medium">{formatDate(lastPerfectDay)}</span>
      </div>

      {/* Motivation Message */}
      {current > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            {current >= 7
              ? "Amazing! You're on a roll! Keep it going! 💪"
              : `${7 - current} more days until your next streak milestone!`}
          </p>
        </div>
      )}

      {current === 0 && longest > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your best streak was {longest} days. Start fresh today! 🌟
          </p>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;
