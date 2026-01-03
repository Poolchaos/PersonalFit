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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMemo } from 'react';

interface WeeklyProgressProps {
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  plannedThisWeek: number;
  totalXP: number;
}

export function WeeklyProgress({
  sessionsThisWeek,
  sessionsLastWeek,
  plannedThisWeek,
  totalXP,
}: WeeklyProgressProps) {
  const completionRate = plannedThisWeek > 0
    ? Math.round((sessionsThisWeek / plannedThisWeek) * 100)
    : 0;

  const trend = useMemo(() => {
    if (sessionsThisWeek > sessionsLastWeek) {
      return { direction: 'up', icon: TrendingUp, color: 'text-success-dark', bg: 'bg-success-50' };
    } else if (sessionsThisWeek < sessionsLastWeek) {
      return { direction: 'down', icon: TrendingDown, color: 'text-error-dark', bg: 'bg-error-50' };
    }
    return { direction: 'same', icon: Minus, color: 'text-neutral-600', bg: 'bg-neutral-100' };
  }, [sessionsThisWeek, sessionsLastWeek]);

  const TrendIcon = trend.icon;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        This Week
      </h3>

      {/* Completion Rate */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-neutral-900">{completionRate}%</span>
          <span className="text-sm text-neutral-600">completion</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className="text-sm text-neutral-600 mt-2">
          {sessionsThisWeek} of {plannedThisWeek} workouts completed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Trend vs Last Week */}
        <div className={`${trend.bg} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon size={20} className={trend.color} />
            <span className="text-xs font-medium text-neutral-700">vs Last Week</span>
          </div>
          <p className={`text-2xl font-bold ${trend.color}`}>
            {sessionsThisWeek > sessionsLastWeek && '+'}
            {sessionsThisWeek - sessionsLastWeek}
          </p>
        </div>

        {/* Total XP */}
        <div className="bg-achievement-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">âš¡</span>
            <span className="text-xs font-medium text-neutral-700">XP Earned</span>
          </div>
          <p className="text-2xl font-bold text-achievement-dark">
            {totalXP}
          </p>
        </div>
      </div>
    </div>
  );
}
