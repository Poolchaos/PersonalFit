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

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, TrendingUp, Dumbbell, Clock, Target, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { WeeklyCalendar } from '../components/calendar/WeeklyCalendar';
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar';
import { PageTransition } from '../components/layout/PageTransition';
import { Card, Modal, Button } from '../design-system';
import { workoutAPI, sessionAPI } from '../api';
import { getEmptyStateImage } from '../utils/imageHelpers';
import type { ScheduleDay, ScheduleWorkout, WorkoutPlan, WorkoutSession } from '../types';

type ViewMode = 'weekly' | 'monthly';

interface WorkoutDay {
  date: string;
  dayName: string;
  workout?: {
    name: string;
    duration_minutes: number;
    focus: string;
    xpEarned?: number;
    exercises?: Array<{
      name: string;
      sets: number;
      reps: number | string;
      duration_seconds?: number;
      rest_seconds?: number;
      equipment?: string[];
      target_muscles?: string[];
      instructions?: string;
    }>;
  };
  isCompleted: boolean;
  isToday: boolean;
  isRestDay: boolean;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const { data: workoutsData } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionAPI.getAll,
  });

  // Manual completion mutation
  const manualCompleteMutation = useMutation({
    mutationFn: async ({ date, workout }: { date: string; workout: WorkoutDay['workout'] }) => {
      const sessionData = {
        session_date: new Date(date).toISOString(),
        completion_status: 'completed',
        actual_duration_minutes: workout?.duration_minutes || 0,
        exercises_completed: workout?.exercises?.length || 0,
        exercises_planned: workout?.exercises?.length || 0,
        notes: `Manually completed workout: ${workout?.name}`,
      };
      return sessionAPI.create(sessionData);
    },
    onSuccess: (_, variables) => {
      const xpEarned = variables.workout.exercises?.length * 10 || 0;
      toast.success(`Workout completed! You earned ${xpEarned} XP!`, {
        icon: 'ðŸŽ‰',
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['accountability'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      setShowWorkoutModal(false);
      setSelectedDay(null);
    },
    onError: (error) => {
      console.error('Manual completion error:', error);
      toast.error('Failed to complete workout. Please try again.');
    },
  });

  const handleManualComplete = () => {
    if (!selectedDay?.workout) return;
    manualCompleteMutation.mutate({
      date: selectedDay.date,
      workout: selectedDay.workout,
    });
  };

  // Transform workouts data into calendar format
  const workoutDays = useMemo((): WorkoutDay[] => {
    if (!workoutsData?.workouts || workoutsData.workouts.length === 0) {
      return [];
    }

    const activePlan = workoutsData.workouts.find((w: WorkoutPlan) => w.is_active);
    if (!activePlan?.plan_data?.weekly_schedule) {
      return [];
    }

    const days: WorkoutDay[] = [];
    const schedule: ScheduleDay[] = activePlan.plan_data.weekly_schedule;

    // Generate workout days for the next 90 days (3 months)
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = date.toLocaleDateString('en-US');

      const scheduledWorkout = schedule.find((s: ScheduleDay) => s.day === dayName);

      // Check if this workout was completed (from sessions)
      const isCompleted = sessionsData?.sessions?.some(
        (session: WorkoutSession) => {
          const sessionDate = new Date(session.session_date).toLocaleDateString('en-US');
          return sessionDate === dateStr && session.completion_status === 'completed';
        }
      ) || false;

      if (scheduledWorkout?.workout) {
        const exercises = scheduledWorkout.workout.exercises || [];
        const duration = scheduledWorkout.workout.duration_minutes || 30;
        const xpEarned = isCompleted ? exercises.length * 10 : undefined;

        days.push({
          date: dateStr,
          dayName,
          workout: {
            name: scheduledWorkout.workout.name || scheduledWorkout.workout.workout_name || `${scheduledWorkout.workout.focus} Day`,
            duration_minutes: duration,
            focus: scheduledWorkout.workout.focus || 'Full Body',
            xpEarned,
            exercises: exercises,
          },
          isCompleted,
          isToday: dateStr === today.toLocaleDateString('en-US'),
          isRestDay: false,
        });
      } else {
        // Rest day
        days.push({
          date: dateStr,
          dayName,
          isCompleted: false,
          isToday: dateStr === today.toLocaleDateString('en-US'),
          isRestDay: true,
        });
      }
    }

    return days;
  }, [workoutsData, sessionsData]);

  const handleDayClick = (day: WorkoutDay) => {
    if (day.workout) {
      setSelectedDay(day);
      setShowWorkoutModal(true);
    }
  };

  // Calculate stats across all days
  const totalCompleted = workoutDays.filter(d => d.isCompleted).length;
  const totalPlanned = workoutDays.filter(d => d.workout).length;
  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  const totalXP = workoutDays
    .filter(d => d.isCompleted && d.workout?.xpEarned)
    .reduce((sum, d) => sum + (d.workout?.xpEarned || 0), 0);

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Workout Schedule</h1>
                <p className="text-neutral-600">Track your progress and plan ahead</p>
              </div>

              {/* View toggle */}
              <div className="flex bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'weekly'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'monthly'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Overall stats */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Overall Progress</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-success-50 rounded-lg">
                  <p className="text-3xl font-bold text-success-600">{totalCompleted}</p>
                  <p className="text-sm text-neutral-600 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-600">{totalPlanned}</p>
                  <p className="text-sm text-neutral-600 mt-1">Planned</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{totalXP}</p>
                  <p className="text-sm text-neutral-600 mt-1">Total XP</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
                  <p className="text-sm text-neutral-600 mt-1">Completion</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Calendar view */}
          {workoutDays.length === 0 ? (
            <Card className="p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <img
                  src={getEmptyStateImage('no-plan')}
                  alt="No plan"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <CalendarIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Workout Plan Found</h3>
                <p className="text-neutral-500 mb-6">
                  Generate your first AI-powered workout plan to get started
                </p>
                <button
                  onClick={() => navigate('/workouts')}
                  className="btn-primary"
                >
                  Generate Workout Plan
                </button>
              </div>
            </Card>
          ) : (
            <>
              {viewMode === 'weekly' ? (
                <WeeklyCalendar workouts={workoutDays} onDayClick={handleDayClick} />
              ) : (
                <MonthlyCalendar workouts={workoutDays} onDayClick={handleDayClick} />
              )}
            </>
          )}
        </div>

        {/* Workout Details Modal */}
        {selectedDay && selectedDay.workout && (
          <Modal
            isOpen={showWorkoutModal}
            onClose={() => {
              setShowWorkoutModal(false);
              setSelectedDay(null);
            }}
            title={selectedDay.workout.name}
            size="lg"
          >
            <div className="space-y-6">
              {/* Workout Header Info */}
              <div className="flex flex-wrap gap-4 pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <CalendarIcon className="w-4 h-4 text-primary-500" />
                  <span className="font-medium">{selectedDay.dayName}</span>
                  <span className="text-neutral-400">â€¢</span>
                  <span>{selectedDay.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>{selectedDay.workout.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Target className="w-4 h-4 text-primary-500" />
                  <span>{selectedDay.workout.focus}</span>
                </div>
                {selectedDay.workout.xpEarned && (
                  <div className="flex items-center gap-2 text-sm text-success-600 font-medium">
                    <Award className="w-4 h-4" />
                    <span>{selectedDay.workout.xpEarned} XP Earned</span>
                  </div>
                )}
              </div>

              {/* Exercises List */}
              {selectedDay.workout.exercises && selectedDay.workout.exercises.length > 0 ? (
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary-500" />
                    Exercises ({selectedDay.workout.exercises.length})
                  </h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {selectedDay.workout.exercises.map((exercise, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-neutral-900">{idx + 1}. {exercise.name}</h5>
                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {exercise.equipment.map((eq, eqIdx) => (
                                <span
                                  key={eqIdx}
                                  className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-2">
                          {exercise.sets && (
                            <span className="font-medium">
                              {exercise.sets} sets Ã— {exercise.reps} reps
                            </span>
                          )}
                          {exercise.duration_seconds && (
                            <span>
                              {Math.floor(exercise.duration_seconds / 60)}:{(exercise.duration_seconds % 60).toString().padStart(2, '0')} duration
                            </span>
                          )}
                          {exercise.rest_seconds && (
                            <span className="text-neutral-500">
                              {exercise.rest_seconds}s rest
                            </span>
                          )}
                        </div>

                        {exercise.target_muscles && exercise.target_muscles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {exercise.target_muscles.map((muscle, mIdx) => (
                              <span
                                key={mIdx}
                                className="text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        )}

                        {exercise.instructions && (
                          <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                            {exercise.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>No exercise details available</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200">
                {selectedDay.isCompleted ? (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4 text-center">
                    <p className="text-success-800 font-semibold flex items-center justify-center gap-2">
                      <Award className="w-5 h-5" />
                      Workout Completed! You earned {selectedDay.workout.xpEarned} XP
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedDay.isToday ? (
                      <Button
                        onClick={() => {
                          setShowWorkoutModal(false);
                          navigate('/workout-session');
                        }}
                        variant="primary"
                        className="flex-1"
                      >
                        Start Workout
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-neutral-600 text-center">
                          {new Date(selectedDay.date) < new Date()
                            ? "Missed this workout? You can still complete it and earn XP!"
                            : "This is a future workout. Come back on the scheduled day to start."}
                        </p>
                        {new Date(selectedDay.date) < new Date() && (
                          <Button
                            onClick={handleManualComplete}
                            variant="primary"
                            className="w-full"
                            disabled={manualCompleteMutation.isPending}
                          >
                            {manualCompleteMutation.isPending ? 'Completing...' : 'Mark as Completed'}
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
                <Button
                  onClick={() => {
                    setShowWorkoutModal(false);
                    setSelectedDay(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageTransition>
    </Layout>
  );
}
