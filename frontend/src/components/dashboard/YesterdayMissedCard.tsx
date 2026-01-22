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

import { Card } from '../../design-system';
import { AlertCircle, Calendar, Clock, Target, Zap } from 'lucide-react';
import type { ScheduleDay } from '../../types';

interface YesterdayMissedCardProps {
  workout: ScheduleDay | null;
  xpAvailable: number;
  onComplete: () => void;
  isCompleting: boolean;
  isCompleted?: boolean;
}

export function YesterdayMissedCard({ workout, xpAvailable, onComplete, isCompleting, isCompleted = false }: YesterdayMissedCardProps) {
  if (!workout?.workout) return null;

  // Different styles based on completion status
  const cardStyles = isCompleted
    ? "border-2 border-green-300 bg-gradient-to-br from-green-50 to-green-100"
    : "border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100";

  const headerBg = isCompleted ? "bg-green-500" : "bg-orange-500";
  const iconBg = isCompleted ? "bg-green-600" : "bg-orange-600";

  return (
    <Card className={`overflow-hidden ${cardStyles}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${headerBg}`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
              {isCompleted ? (
                <Zap className="w-6 h-6 fill-white" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">
                {isCompleted ? "âœ… Completed Yesterday's Workout" : "Yesterday's Missed Workout"}
              </p>
              <h2 className="text-2xl font-bold">{workout.workout.name}</h2>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm opacity-90">{isCompleted ? "XP Earned" : "Available XP"}</p>
            <div className="flex items-center gap-1">
              <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-2xl font-bold">{xpAvailable}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-neutral-700 mb-4">
          {isCompleted
            ? "Great job completing yesterday's workout! You earned XP and kept your momentum going. Click below to complete it again for testing."
            : "You missed yesterday's workout, but it's not too late! Complete it now to earn XP and keep your progress going."}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Duration</p>
              <p className="font-bold text-neutral-900 text-sm">{workout.workout.duration_minutes}m</p>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Focus</p>
              <p className="font-bold text-neutral-900 text-sm truncate" title={workout.workout.focus}>
                {workout.workout.focus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Exercises</p>
              <p className="font-bold text-neutral-900 text-sm">{workout.workout.exercises.length}</p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className={`w-full ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'} text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          <span className="text-lg">
            {isCompleting
              ? 'Completing...'
              : isCompleted
                ? 'Test: Complete Again'
                : 'Complete This Workout'}
          </span>
        </button>

        <p className="text-xs text-neutral-500 text-center mt-3">
          {isCompleted
            ? 'Testing: Click to complete yesterday\'s workout again and earn XP'
            : 'Completing this will count towards your weekly goals'}
        </p>
      </div>
    </Card>
  );
}
