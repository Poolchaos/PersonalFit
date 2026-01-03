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
import { Calendar, Check, Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface WorkoutDay {
  date: string;
  dayName: string;
  workout?: {
    name: string;
    duration_minutes: number;
    focus: string;
    xpEarned?: number;
  };
  isCompleted: boolean;
  isToday: boolean;
  isRestDay: boolean;
}

interface WeeklyCalendarProps {
  workouts: WorkoutDay[];
  onDayClick?: (day: WorkoutDay) => void;
}

export function WeeklyCalendar({ workouts, onDayClick }: WeeklyCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const getWeekDays = (offset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (offset * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays(currentWeekOffset);

  const getWorkoutForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US');
    return workouts.find(w => w.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  const getMonthYear = () => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return `${firstDay.toLocaleDateString('en-US', { month: 'short' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  };

  return (
    <Card className="p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Weekly Schedule</h2>
            <p className="text-sm text-neutral-500">{getMonthYear()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>

          {currentWeekOffset !== 0 && (
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Today
            </button>
          )}

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center py-2">
            <p className="text-xs font-semibold text-neutral-500">{day}</p>
          </div>
        ))}

        {/* Day cells */}
        {weekDays.map((date, idx) => {
          const workoutDay = getWorkoutForDate(date);
          const today = isToday(date);
          const hasWorkout = workoutDay?.workout;
          const isCompleted = workoutDay?.isCompleted || false;
          const isRestDay = workoutDay?.isRestDay || !hasWorkout;

          return (
            <button
              key={idx}
              onClick={() => workoutDay && onDayClick?.(workoutDay)}
              className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md
                ${today ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-200'}
                ${isCompleted ? 'bg-gradient-to-br from-success-50 to-success-100' : 'bg-white'}
                ${isRestDay && !today ? 'bg-neutral-50' : ''}
                ${hasWorkout ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
              `}
            >
              {/* Date number */}
              <div className={`text-center mb-2 ${today ? 'font-bold text-primary-600' : 'text-neutral-700'}`}>
                <span className="text-lg">{date.getDate()}</span>
              </div>

              {/* Workout info or rest day */}
              {isRestDay ? (
                <div className="text-center">
                  <p className="text-xs text-neutral-400 font-medium">Rest Day</p>
                </div>
              ) : hasWorkout ? (
                <div className="space-y-1">
                  {/* Completion check */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-success-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Workout name */}
                  <p className="text-xs font-semibold text-neutral-800 truncate">
                    {workoutDay.workout?.name}
                  </p>

                  {/* Duration */}
                  <div className="flex items-center justify-center gap-1 text-xs text-neutral-600">
                    <Clock className="w-3 h-3" />
                    <span>{workoutDay.workout?.duration_minutes}m</span>
                  </div>

                  {/* Focus badge */}
                  <div className="text-center">
                    <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                      {workoutDay.workout?.focus.split(' ')[0]}
                    </span>
                  </div>

                  {/* XP earned (if completed) */}
                  {isCompleted && workoutDay.workout?.xpEarned && (
                    <div className="flex items-center justify-center gap-1 text-xs text-yellow-600 font-bold">
                      <Flame className="w-3 h-3 fill-yellow-500" />
                      <span>+{workoutDay.workout?.xpEarned} XP</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Today indicator */}
              {today && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Week summary */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-success-600">
              {workouts.filter(w => w.isCompleted && weekDays.some(d => d.toLocaleDateString('en-US') === w.date)).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Planned</p>
            <p className="text-2xl font-bold text-primary-600">
              {workouts.filter(w => w.workout && weekDays.some(d => d.toLocaleDateString('en-US') === w.date)).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Rest Days</p>
            <p className="text-2xl font-bold text-neutral-600">
              {workouts.filter(w => w.isRestDay && weekDays.some(d => d.toLocaleDateString('en-US') === w.date)).length}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
