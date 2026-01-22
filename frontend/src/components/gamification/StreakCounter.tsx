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

import { getGamificationIcon } from '../../utils/imageHelpers';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  size?: 'small' | 'medium' | 'large';
  showLongest?: boolean;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  size = 'medium',
  showLongest = true
}: StreakCounterProps) {
  const isOnFire = currentStreak >= 7;
  const isLegendary = currentStreak >= 30;

  const sizeClasses = {
    small: { icon: 'w-5 h-5', text: 'text-sm', container: 'px-3 py-1.5' },
    medium: { icon: 'w-6 h-6', text: 'text-base', container: 'px-4 py-2' },
    large: { icon: 'w-8 h-8', text: 'text-lg', container: 'px-5 py-3' },
  };

  const classes = sizeClasses[size];

  const getStreakColor = () => {
    if (isLegendary) return 'from-purple-500 to-pink-500';
    if (isOnFire) return 'from-orange-500 to-red-600';
    if (currentStreak >= 3) return 'from-yellow-400 to-orange-500';
    return 'from-neutral-400 to-neutral-500';
  };

  const getStreakMessage = () => {
    if (isLegendary) return 'LEGENDARY STREAK!';
    if (isOnFire) return 'ON FIRE!';
    if (currentStreak >= 3) return 'Great momentum!';
    if (currentStreak === 0) return 'Start your streak today!';
    return 'Keep it going!';
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 bg-gradient-to-r ${getStreakColor()} text-white rounded-lg ${classes.container} shadow-lg relative overflow-hidden`}>
        {/* Animated flame background for streaks >= 7 */}
        {isOnFire && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-300 to-transparent animate-pulse" />
          </div>
        )}

        <img
          src={getGamificationIcon('streak')}
          alt="Streak"
          className={`${classes.icon} ${isOnFire ? 'animate-bounce' : ''} relative z-10`}
        />
        <div className="relative z-10">
          <div className={`font-bold ${classes.text}`}>
            {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
          </div>
          <div className={`text-xs opacity-90`}>
            {getStreakMessage()}
          </div>
        </div>
      </div>

      {showLongest && longestStreak > 0 && (
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <img
            src={getGamificationIcon('xp')}
            alt="Best Streak"
            className="w-4 h-4"
          />
          <span>Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}</span>
        </div>
      )}

      {currentStreak === 0 && (
        <p className="text-xs text-neutral-500">
          Complete a workout today to start your streak!
        </p>
      )}

      {currentStreak > 0 && currentStreak < 7 && (
        <p className="text-xs text-neutral-500">
          {7 - currentStreak} more day{7 - currentStreak !== 1 ? 's' : ''} to reach ON FIRE status!
        </p>
      )}
    </div>
  );
}
