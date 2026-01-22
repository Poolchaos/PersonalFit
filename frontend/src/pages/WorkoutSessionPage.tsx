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

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Timer,
  Zap,
  Trophy,
  Flame,
  X,
  Moon,
  PartyPopper,
} from 'lucide-react';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { Card, Confetti } from '../design-system';
import { workoutAPI, sessionAPI } from '../api';
import { getExerciseImage } from '../utils/imageHelpers';
import toast from 'react-hot-toast';
import type { ScheduleDay, ScheduleExercise, WorkoutPlan, ExerciseLog } from '../types';

interface SessionCreateData {
  plan_id?: string;
  session_date: string;
  completion_status: 'planned' | 'completed' | 'skipped' | 'partial';
  actual_duration_minutes: number;
  exercises_completed: ExerciseLog[];
  exercises_planned: number;
  notes?: string;
}

interface ExerciseCompletion {
  exerciseId: string;
  sets: {
    reps: number;
    weight: number;
    completed: boolean;
  }[];
}

export default function WorkoutSessionPage() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const queryClient = useQueryClient();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<ExerciseCompletion[]>([]);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [sessionStartTime] = useState(new Date());
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch workout data
  const { data: workoutsData, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  // Get today's workout from active plan
  const todayWorkout = (() => {
    if (!workoutsData?.workouts) return null;
    const activePlan = workoutsData.workouts.find((w: WorkoutPlan) => w.is_active);
    if (!activePlan?.plan_data?.weekly_schedule) return null;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const schedule: ScheduleDay[] = activePlan.plan_data.weekly_schedule;
    const todaySchedule = schedule.find((s: ScheduleDay) => s.day === today);

    return todaySchedule?.workout || null;
  })();

  const exercises = useMemo(() => todayWorkout?.exercises || [], [todayWorkout]);
  const currentExercise = exercises[currentExerciseIndex];

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: (sessionData: SessionCreateData) => sessionAPI.create(sessionData),
    onSuccess: async () => {
      // Invalidate and refetch gamification data immediately
      await queryClient.invalidateQueries({ queryKey: ['gamification'] });
      await queryClient.refetchQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['accountability'] });
    },
  });

  // Initialize exercise completion tracking
  useEffect(() => {
    if (exercises.length > 0 && completedExercises.length === 0) {
      const initialCompletion = exercises.map((exercise: ScheduleExercise) => ({
        exerciseId: exercise.name,
        sets: Array(exercise.sets || 3).fill(null).map(() => ({
          reps: exercise.reps || 10,
          weight: 0,
          completed: false,
        })),
      }));
      // Schedule state update to avoid cascading renders
      setTimeout(() => setCompletedExercises(initialCompletion), 0);
    }
  }, [exercises, completedExercises.length]);

  // Rest timer countdown
  useEffect(() => {
    if (isRestTimerActive && restTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setRestTimeRemaining(restTimeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isRestTimerActive && restTimeRemaining === 0) {
      // Schedule state update to avoid cascading renders
      setTimeout(() => {
        setIsRestTimerActive(false);
        toast.success('Rest time over! Ready for your next set?', {

          duration: 3000,
        });
      }, 0);
    }
  }, [isRestTimerActive, restTimeRemaining]);

  const startRestTimer = () => {
    const restTime = currentExercise?.rest_seconds || 60;
    setRestTimeRemaining(restTime);
    setIsRestTimerActive(true);
  };

  const skipRestTimer = () => {
    setIsRestTimerActive(false);
    setRestTimeRemaining(0);
  };

  const toggleSetCompletion = (setIndex: number) => {
    const updatedCompletion = [...completedExercises];
    const exerciseCompletion = updatedCompletion[currentExerciseIndex];

    if (exerciseCompletion) {
      exerciseCompletion.sets[setIndex].completed = !exerciseCompletion.sets[setIndex].completed;

      // Award XP for completing a set
      if (exerciseCompletion.sets[setIndex].completed) {
        const xpGained = 10;
        setTotalXPEarned(prev => prev + xpGained);

        // Show mini XP animation
        toast.success(`+${xpGained} XP`, {
          icon: 'âš¡',
          duration: 1500,
        });

        // Start rest timer after completing a set
        if (setIndex < exerciseCompletion.sets.length - 1) {
          startRestTimer();
        }
      }

      setCompletedExercises(updatedCompletion);
    }
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
    }
  };

  const completeWorkout = async () => {
    const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60);

    const completedExercisesList: ExerciseLog[] = completedExercises
      .filter(ex => ex.sets.some(set => set.completed))
      .map(ex => ({
        exercise_name: ex.exerciseId,
        sets_completed: ex.sets
          .filter(set => set.completed)
          .map((set, idx) => ({
            set_number: idx + 1,
            reps: set.reps,
            weight_kg: set.weight,
          })),
        notes: undefined,
      }));

    const sessionData: SessionCreateData = {
      plan_id: workoutId || undefined,
      session_date: new Date().toISOString(),
      completion_status: 'completed',
      actual_duration_minutes: sessionDuration,
      exercises_completed: completedExercisesList,
      exercises_planned: exercises.length,
      notes: `Completed ${completedExercisesList.length} exercises`,
    };

    try {
      await saveSessionMutation.mutateAsync(sessionData);
      setShowCelebration(true);

      // Navigate to dashboard after celebration
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      toast.error('Failed to save workout session');
      console.error(error);
    }
  };

  const cancelWorkout = () => {
    if (confirm('Are you sure you want to cancel this workout? Your progress will not be saved.')) {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading workout...</p>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (!todayWorkout || exercises.length === 0) {
    return (
      <Layout>
        <PageTransition>
          <div className="max-w-2xl mx-auto mt-12">
            <Card className="p-8 text-center">
              <div className="mb-4"><Moon className="w-16 h-16 text-indigo-400 mx-auto" /></div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">No Workout Scheduled</h2>
              <p className="text-neutral-600 mb-6">
                Today is a rest day! Take time to recover and come back stronger.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </Card>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  const progressPercentage = ((currentExerciseIndex + 1) / exercises.length) * 100;
  const allSetsCompleted = completedExercises[currentExerciseIndex]?.sets.every(set => set.completed) || false;

  return (
    <Layout>
      <PageTransition>
        {/* Confetti Effect */}
        <Confetti active={showCelebration} />

        <div className="max-w-4xl mx-auto">
          {/* Celebration Overlay */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mb-6"
                  >
                    <PartyPopper className="w-20 h-20 text-yellow-400 mx-auto" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-4">Workout Complete!</h2>
                  <div className="flex items-center justify-center gap-4 text-white text-xl mb-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <span>+{totalXPEarned} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <span>{completedExercises.filter(ex => ex.sets.some(s => s.completed)).length} Exercises</span>
                    </div>
                  </div>
                  <p className="text-neutral-300">Redirecting to dashboard...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                  {todayWorkout.name || `${todayWorkout.focus} Workout`}
                </h1>
                <p className="text-neutral-600">
                  Exercise {currentExerciseIndex + 1} of {exercises.length}
                </p>
              </div>
              <button
                onClick={cancelWorkout}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Cancel workout"
              >
                <X className="w-6 h-6 text-neutral-600" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-600 mb-1">
                <Zap className="w-5 h-5" />
                <span className="text-2xl font-bold">{totalXPEarned}</span>
              </div>
              <p className="text-xs text-neutral-600">XP Earned</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary-600 mb-1">
                <Check className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {completedExercises.filter(ex => ex.sets.some(s => s.completed)).length}
                </span>
              </div>
              <p className="text-xs text-neutral-600">Exercises Done</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                <Flame className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60)}
                </span>
              </div>
              <p className="text-xs text-neutral-600">Minutes</p>
            </Card>
          </div>

          {/* Rest Timer */}
          <AnimatePresence>
            {isRestTimerActive && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
                  <div className="text-center">
                    <Timer className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Rest Time</h3>
                    <div className="text-5xl font-bold text-blue-600 mb-4">
                      {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-neutral-600 mb-4">Take a breather, you're doing great!</p>
                    <button
                      onClick={skipRestTimer}
                      className="btn-secondary"
                    >
                      Skip Rest
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Exercise Card */}
          {currentExercise && (
            <Card className="p-6 mb-6 overflow-hidden">
              {/* Exercise Image Preview */}
              <div className="-m-6 mb-6 h-48 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
                <img
                  src={getExerciseImage(currentExercise.name)}
                  alt={currentExercise.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {currentExercise.name}
                  </h2>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentExercise.target_muscles?.map((muscle: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
                {currentExercise.instructions && (
                  <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Instructions:</h4>
                    <p className="text-neutral-700 text-sm">{currentExercise.instructions}</p>
                  </div>
                )}
              </div>

              {/* Sets Tracking */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Track Your Sets ({completedExercises[currentExerciseIndex]?.sets.filter(s => s.completed).length || 0}/{currentExercise.sets || 3})
                </h3>
                <div className="space-y-3">
                  {completedExercises[currentExerciseIndex]?.sets.map((set, setIndex) => (
                    <motion.button
                      key={setIndex}
                      onClick={() => toggleSetCompletion(setIndex)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        set.completed
                          ? 'bg-success-100 border-success-500'
                          : 'bg-white border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              set.completed ? 'bg-success-500' : 'bg-neutral-200'
                            }`}
                          >
                            {set.completed && <Check className="w-5 h-5 text-white" />}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-neutral-900">Set {setIndex + 1}</p>
                            <p className="text-sm text-neutral-600">
                              {currentExercise.reps || 10} reps
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {set.completed && (
                            <div className="flex items-center gap-1 text-yellow-600 font-bold">
                              <Zap className="w-4 h-4" />
                              <span>+10 XP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={goToPreviousExercise}
              disabled={currentExerciseIndex === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-neutral-200 text-neutral-700 hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentExerciseIndex === exercises.length - 1 && allSetsCompleted ? (
              <button
                onClick={completeWorkout}
                disabled={saveSessionMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-success-600 to-success-700 text-white font-semibold hover:from-success-700 hover:to-success-800 disabled:opacity-50 transition-all shadow-lg"
              >
                <Trophy className="w-5 h-5" />
                {saveSessionMutation.isPending ? 'Saving...' : 'Finish Workout'}
              </button>
            ) : (
              <button
                onClick={goToNextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next Exercise
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
