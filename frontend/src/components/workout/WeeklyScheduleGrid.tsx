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
import { Check, Dumbbell, Moon } from 'lucide-react';

interface WorkoutDay {
  day: string;
  workout?: {
    name: string;
    duration_minutes: number;
    focus: string;
    exercises: Array<{
      name: string;
      target_muscles: string[];
    }>;
  };
}

interface WeeklyScheduleGridProps {
  schedule: WorkoutDay[];
  totalXP: number;
}

export function WeeklyScheduleGrid({ schedule, totalXP }: WeeklyScheduleGridProps) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get current day of the week
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Map schedule to days of week
  const weekGrid = daysOfWeek.map(day => {
    const daySchedule = schedule.find(s => s.day === day);
    return {
      day,
      ...daySchedule,
    };
  });

  const workoutDays = schedule.filter(d => d.workout).length;
  const restDays = 7 - workoutDays;
  const xpPerWorkout = totalXP / workoutDays;

  return (
    <div className="space-y-6">
      {/* Week Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="text-3xl font-bold text-primary-600">{workoutDays}</div>
          <div className="text-sm text-neutral-600 mt-1">Workout Days</div>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-3xl font-bold text-neutral-600">{restDays}</div>
          <div className="text-sm text-neutral-600 mt-1">Rest Days</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">{Math.round(xpPerWorkout)}</div>
          <div className="text-sm text-neutral-600 mt-1">XP/Workout</div>
        </div>
      </div>

      {/* Weekly Calendar Grid - Row Layout */}
      <div className="space-y-3">
        {weekGrid.map((dayData, index) => {
          const isWorkoutDay = !!dayData.workout;
          const isToday = dayData.day === currentDay;

          return (
            <motion.div
              key={dayData.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg h-24
                ${isToday && isWorkoutDay
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100 ring-2 ring-yellow-300'
                  : isToday && !isWorkoutDay
                  ? 'border-neutral-300 bg-neutral-100 ring-2 ring-neutral-300'
                  : isWorkoutDay
                  ? 'border-primary-300 bg-gradient-to-r from-primary-50 to-primary-100'
                  : 'border-neutral-200 bg-neutral-50'
                }
              `}
            >
              <div className="flex items-center h-full">
                {/* Day Header - Left Side */}
                <div className={`w-20 h-full flex items-center justify-center font-bold text-base relative ${
                  isToday && isWorkoutDay
                    ? 'bg-yellow-500 text-white'
                    : isToday && !isWorkoutDay
                    ? 'bg-neutral-400 text-white'
                    : isWorkoutDay
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {dayData.day.substring(0, 3)}
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Day Content - Right Side */}
                <div className="flex-1 px-4 py-3 min-w-0">
                  {isWorkoutDay && dayData.workout ? (
                    <div className="flex items-center gap-3 h-full">
                      {/* Icon */}
                      <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>

                      {/* Workout Info */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-sm text-neutral-900 mb-0.5 truncate">
                          {dayData.workout.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 overflow-hidden">
                          <span className="px-2 py-0.5 bg-primary-200 text-primary-800 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                            {dayData.workout.focus}
                          </span>
                          <span className="text-neutral-400 flex-shrink-0">â€¢</span>
                          <span className="whitespace-nowrap flex-shrink-0">{dayData.workout.duration_minutes} min</span>
                          <span className="text-neutral-400 flex-shrink-0">â€¢</span>
                          <span className="whitespace-nowrap flex-shrink-0">{dayData.workout.exercises.length} exercises</span>
                        </div>
                      </div>

                      {/* Target Muscles - Desktop only */}
                      <div className="hidden xl:flex flex-shrink-0 gap-1.5 max-w-sm overflow-hidden">
                        {[...new Set(dayData.workout.exercises.flatMap(ex => ex.target_muscles))].slice(0, 4).map((muscle, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-md text-xs font-medium whitespace-nowrap"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>

                      {/* XP Badge */}
                      <div className="flex items-center text-yellow-600 font-bold text-base flex-shrink-0 ml-2">
                        <span className="whitespace-nowrap">+{Math.round(xpPerWorkout)} XP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 h-full">
                      {/* Icon */}
                      <div className="w-11 h-11 bg-neutral-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <Moon className="w-5 h-5 text-neutral-500" />
                      </div>

                      {/* Rest Day Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-neutral-600 mb-0.5">
                          Rest Day
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Recovery & regeneration
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly XP Forecast */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Weekly XP Forecast</h3>
            <p className="text-sm text-neutral-600">
              Complete all {workoutDays} workouts to earn maximum XP
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-yellow-600">{totalXP}</div>
            <div className="text-sm text-neutral-600">Total XP</div>
          </div>
        </div>

        {/* Progress visualization */}
        <div className="mt-4 space-y-2">
          {schedule.filter(d => d.workout).map((day, index) => (
            <div key={day.day} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-neutral-700">{day.day}</div>
              <div className="flex-1 h-8 bg-white rounded-full overflow-hidden border border-yellow-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(xpPerWorkout / totalXP) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-end pr-2"
                >
                  <span className="text-xs font-bold text-white">+{Math.round(xpPerWorkout)} XP</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Week Projection */}
      <div className="bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-300 rounded-xl p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-primary-600" />
          4-Week Projection
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((week) => (
            <motion.div
              key={week}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: week * 0.1 }}
              className="bg-white rounded-lg p-4 text-center border-2 border-primary-200"
            >
              <div className="text-sm font-semibold text-neutral-600 mb-2">Week {week}</div>
              <div className="text-2xl font-bold text-primary-600">{totalXP}</div>
              <div className="text-xs text-neutral-500 mt-1">XP</div>
              <div className="text-xs text-neutral-600 mt-2">{workoutDays} workouts</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <div className="inline-block bg-gradient-to-r from-primary-500 to-purple-500 text-white px-6 py-3 rounded-full">
            <span className="font-bold text-2xl">{totalXP * 4}</span>
            <span className="text-sm ml-2">Total XP in 4 Weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
