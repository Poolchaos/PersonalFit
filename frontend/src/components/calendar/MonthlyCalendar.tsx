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
import { Calendar, Check, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
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

interface MonthlyCalendarProps {
  workouts: WorkoutDay[];
  onDayClick?: (day: WorkoutDay) => void;
}

export function MonthlyCalendar({ workouts, onDayClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Adjust to make Monday the first day (0 = Monday, 6 = Sunday)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWorkoutForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-US');
    return workouts.find(w => w.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);

  const isCurrentMonth = () => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  // Calculate monthly stats
  const monthWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate.getMonth() === currentDate.getMonth() &&
           workoutDate.getFullYear() === currentDate.getFullYear();
  });

  const completedCount = monthWorkouts.filter(w => w.isCompleted).length;
  const plannedCount = monthWorkouts.filter(w => w.workout).length;
  const totalXP = monthWorkouts.filter(w => w.isCompleted).reduce((sum, w) => sum + (w.workout?.xpEarned || 0), 0);

  return (
    <Card className="p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Monthly View</h2>
            <p className="text-sm text-neutral-500">{monthYear}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>

          {!isCurrentMonth() && (
            <button
              onClick={goToCurrentMonth}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              This Month
            </button>
          )}

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center py-2">
            <p className="text-xs font-semibold text-neutral-500">{day}</p>
          </div>
        ))}

        {/* Day cells */}
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

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
                aspect-square relative p-2 rounded-lg border transition-all duration-200
                ${today ? 'border-primary-500 ring-2 ring-primary-200 shadow-md' : 'border-neutral-200'}
                ${isCompleted ? 'bg-gradient-to-br from-success-50 to-success-100' : 'bg-white'}
                ${isRestDay && !today ? 'bg-neutral-50' : ''}
                ${hasWorkout ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'}
              `}
            >
              {/* Date number */}
              <div className={`text-xs font-semibold mb-1 ${today ? 'text-primary-600' : 'text-neutral-700'}`}>
                {date.getDate()}
              </div>

              {/* Workout indicator */}
              {hasWorkout && (
                <div className="flex flex-col items-center justify-center gap-1">
                  {isCompleted ? (
                    <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-3 h-3 text-primary-600" />
                    </div>
                  )}

                  <div className="text-xs text-center">
                    <span className={`font-medium ${isCompleted ? 'text-success-700' : 'text-primary-700'}`}>
                      {workoutDay.workout?.duration_minutes}m
                    </span>
                  </div>
                </div>
              )}

              {/* Today indicator dot */}
              {today && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly summary */}
      <div className="pt-6 border-t border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">This Month</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">{completedCount}</p>
            <p className="text-xs text-neutral-500 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{plannedCount}</p>
            <p className="text-xs text-neutral-500 mt-1">Planned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{totalXP}</p>
            <p className="text-xs text-neutral-500 mt-1">XP Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-600">
              {plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">Completion</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success-100 rounded border border-success-200" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded border border-primary-200 flex items-center justify-center">
              <Dumbbell className="w-2 h-2 text-primary-600" />
            </div>
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-50 rounded border border-neutral-200" />
            <span>Rest Day</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
