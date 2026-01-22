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
import { Calendar, Clock, Target, Zap, ArrowRight, Dumbbell } from 'lucide-react';
import type { ScheduleDay } from '../../types';

interface TomorrowPreviewCardProps {
  workout: ScheduleDay | null;
  xpToEarn: number;
}

export function TomorrowPreviewCard({ workout, xpToEarn }: TomorrowPreviewCardProps) {
  if (!workout?.workout) {
    return (
      <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="p-6 text-center">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-600 mb-1">Tomorrow</h3>
          <p className="text-sm text-neutral-500">Rest day scheduled</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 hover:shadow-lg transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Tomorrow · {workout.day}</p>
              <h3 className="font-bold text-neutral-900">{workout.workout.name}</h3>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-400" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-neutral-500">Duration</p>
            <p className="font-bold text-sm text-neutral-900">{workout.workout.duration_minutes}m</p>
          </div>

          <div className="text-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-neutral-500">Exercises</p>
            <p className="font-bold text-sm text-neutral-900">{workout.workout.exercises.length}</p>
          </div>

          <div className="text-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-neutral-500">XP</p>
            <p className="font-bold text-sm text-neutral-900">{xpToEarn}</p>
          </div>
        </div>

        {/* Focus area */}
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <p className="text-xs text-neutral-500 mb-1">Focus Area</p>
          <p className="font-semibold text-neutral-900">{workout.workout.focus}</p>
        </div>

        {/* Exercise preview (first 3) */}
        <div className="mt-4">
          <p className="text-xs text-neutral-500 mb-2">Includes:</p>
          <div className="space-y-1">
            {workout.workout.exercises.slice(0, 3).map((exercise, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <span className="text-neutral-700 truncate">{exercise.name}</span>
              </div>
            ))}
            {workout.workout.exercises.length > 3 && (
              <p className="text-xs text-neutral-400 pl-7">
                +{workout.workout.exercises.length - 3} more
              </p>
            )}
          </div>
        </div>

        {/* Motivational message */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
          <p className="text-xs text-purple-900 font-medium text-center flex items-center justify-center gap-1">
            <Dumbbell className="w-3 h-3" /> Get ready to crush it tomorrow!
          </p>
        </div>
      </div>
    </Card>
  );
}
