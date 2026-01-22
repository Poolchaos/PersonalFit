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

import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { HeroSection } from '../components/dashboard/HeroSection';
import { TodayWorkoutCard } from '../components/dashboard/TodayWorkoutCard';
import { YesterdayMissedCard } from '../components/dashboard/YesterdayMissedCard';
import { TomorrowPreviewCard } from '../components/dashboard/TomorrowPreviewCard';
import { WeeklyStatsCard } from '../components/dashboard/WeeklyStatsCard';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { WeeklyProgress } from '../components/dashboard/WeeklyProgress';
import { QuickActions } from '../components/dashboard/QuickActions';
import { XPProgressBar } from '../components/gamification/XPProgressBar';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../design-system';
import { profileAPI, workoutAPI, gamificationAPI, sessionAPI, queryKeys } from '../api';
import type { ScheduleDay, WorkoutPlan, WorkoutSession } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: profileAPI.getProfile,
  });

  const { data: workoutsData } = useQuery({
    queryKey: queryKeys.workouts.all,
    queryFn: workoutAPI.getAll,
  });

  const { data: gamificationData } = useQuery({
    queryKey: queryKeys.gamification.stats(),
    queryFn: gamificationAPI.getStats,
    staleTime: 0, // Always refetch gamification data
    refetchOnMount: 'always', // Refetch when component mounts
  });


  const { data: sessionsData } = useQuery({
    queryKey: queryKeys.sessions.all,
    queryFn: sessionAPI.getAll,
  });

  // Check if profile is incomplete (only redirect if truly incomplete, not just missing optional data)
  const isProfileIncomplete =
    profileData &&
    (!profileData.user.profile.first_name || !profileData.user.profile.last_name);

  // Auto-redirect to onboarding for genuinely new users (no name means they never completed step 1)
  useEffect(() => {
    if (isProfileIncomplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [isProfileIncomplete, navigate]);

  // Extract today and tomorrow workouts from the active plan
  const { todayWorkout, tomorrowWorkout, yesterdayWorkout } = useMemo(() => {
    if (workoutsData?.workouts && workoutsData.workouts.length > 0) {
      const activePlan = workoutsData.workouts.find((w: WorkoutPlan) => w.is_active);
      if (activePlan?.plan_data?.weekly_schedule) {
        const schedule: ScheduleDay[] = activePlan.plan_data.weekly_schedule;
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' });
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toLocaleDateString('en-US', { weekday: 'long' });

        return {
          todayWorkout: schedule.find((s: ScheduleDay) => s.day === today) || null,
          tomorrowWorkout: schedule.find((s: ScheduleDay) => s.day === tomorrow) || null,
          yesterdayWorkout: schedule.find((s: ScheduleDay) => s.day === yesterday) || null,
        };
      }
    }
    return { todayWorkout: null, tomorrowWorkout: null, yesterdayWorkout: null };
  }, [workoutsData]);

  const todayXP = todayWorkout?.workout ? todayWorkout.workout.exercises.length * 10 : 0;
  const tomorrowXP = tomorrowWorkout?.workout ? tomorrowWorkout.workout.exercises.length * 10 : 0;
  const yesterdayXP = yesterdayWorkout?.workout ? yesterdayWorkout.workout.exercises.length * 10 : 0;

  // Calculate planned workouts this week from the active plan
  const workoutsPlannedThisWeek = useMemo(() => {
    if (workoutsData?.workouts && workoutsData.workouts.length > 0) {
      const activePlan = workoutsData.workouts.find((w: WorkoutPlan) => w.is_active);
      if (activePlan?.plan_data?.weekly_schedule) {
        // Count non-rest days in the weekly schedule
        return activePlan.plan_data.weekly_schedule.filter((day: ScheduleDay) =>
          day.workout && day.workout.type !== 'Rest Day'
        ).length;
      }
    }
    return 0;
  }, [workoutsData]);

  // Check if today's workout is completed from session data
  const isTodayCompleted = useMemo(() => {
    if (!sessionsData?.sessions) return false;
    const today = new Date().toLocaleDateString('en-US');
    return sessionsData.sessions.some(
      (session: WorkoutSession) => {
        const sessionDate = new Date(session.session_date).toLocaleDateString('en-US');
        return sessionDate === today && session.completion_status === 'completed';
      }
    );
  }, [sessionsData]);

  // Check if yesterday's workout was completed
  const isYesterdayCompleted = useMemo(() => {
    if (!sessionsData?.sessions) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-US');
    return sessionsData.sessions.some(
      (session: WorkoutSession) => {
        const sessionDate = new Date(session.session_date).toLocaleDateString('en-US');
        return sessionDate === yesterdayStr && session.completion_status === 'completed';
      }
    );
  }, [sessionsData]);

  // ALWAYS show yesterday's card if workout exists (for testing/retry)
  const showYesterdayCard = yesterdayWorkout !== null;

  // Manual completion mutation
  const manualCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!yesterdayWorkout?.workout) return;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sessionData: Partial<WorkoutSession> = {
        session_date: yesterday.toISOString(),
        completion_status: 'completed',
        actual_duration_minutes: yesterdayWorkout.workout.duration_minutes,
        exercises_completed: [], // Empty array - will be populated by backend
        notes: `Manually completed: ${yesterdayWorkout.workout.name}`,
      };
      return sessionAPI.create(sessionData);
    },
    onSuccess: () => {
      toast.success(`Yesterday's workout completed! You earned ${yesterdayXP} XP!`, {
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountability.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.all });
    },
    onError: (error) => {
      console.error('Manual completion error:', error);
      toast.error('Failed to complete workout. Please try again.');
    },
  });

  const handleCompleteYesterday = () => {
    manualCompleteMutation.mutate();
  };

  // Debug: Manual test completion
  // const testCompleteMutation = useMutation({
  //   mutationFn: async () => {
  //     if (!todayWorkout) return;
  //     const today = new Date();
  //     const sessionData = {
  //       session_date: today.toISOString(),
  //       completion_status: 'completed',
  //       actual_duration_minutes: todayWorkout?.workout.duration_minutes || 30,
  //       exercises_completed: todayWorkout?.workout.exercises?.length || 5,
  //       exercises_planned: todayWorkout?.workout.exercises?.length || 5,
  //       notes: `Test completion: ${todayWorkout?.workout.name}`,
  //     };
  //     return sessionAPI.create(sessionData);
  //   },
  //   onSuccess: () => {
  //     toast.success(`Workout completed! Check your XP!`, {
  //       duration: 4000,
  //     });
  //     queryClient.invalidateQueries({ queryKey: ['sessions'] });
  //     queryClient.invalidateQueries({ queryKey: ['accountability'] });
  //     queryClient.invalidateQueries({ queryKey: ['gamification'] });
  //   },
  //   onError: (error) => {
  //     console.error('Test completion error:', error);
  //     toast.error('Failed to complete workout. Please try again.');
  //   },
  // });

  // Get current week number
  const getCurrentWeek = () => {
    const onejan = new Date(new Date().getFullYear(), 0, 1);
    return Math.ceil((((new Date().getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  };

  // Show loading state while checking profile
  if (!profileData || isProfileIncomplete) {
    return (
      <Layout>
        <PageTransition>
          <div className="max-w-3xl mx-auto mt-12">
            <Card className="border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="p-8 text-center">
                <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-neutral-900 mb-3">Setting up your profile...</h2>
                <p className="text-neutral-600">
                  Redirecting you to complete your fitness profile
                </p>
              </div>
            </Card>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  const handleStartWorkout = () => {
    navigate('/workout-session');
  };

  return (
    <Layout>
      <PageTransition>
        <div>
        {/* Hero Section with Gamification */}
        <HeroSection />

        {/* Gamification Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* XP Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Progress</h3>
            <XPProgressBar
              currentXP={gamificationData?.xp || 0}
              level={gamificationData?.level || 1}
              xpForNextLevel={gamificationData?.xpForNextLevel || 500}
              levelProgress={gamificationData?.levelProgress || 0}
              showAnimation={true}
            />
          </Card>

          {/* Streak Counter */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Consistency Streak</h3>
            <StreakCounter
              currentStreak={gamificationData?.currentStreak || 0}
              longestStreak={gamificationData?.longestStreak || 0}
            />
          </Card>
        </div>

        {/* DEBUG: Test Completion Button */}
        {/* {todayWorkout && !isTodayCompleted && (
          <div className="mb-4">
            <button
              onClick={() => testCompleteMutation.mutate()}
              disabled={testCompleteMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {testCompleteMutation.isPending ? 'Completing...' : 'Test Complete Today\'s Workout'}
            </button>
          </div>
        )} */}

        {/* Today & Tomorrow Workouts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Workout - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TodayWorkoutCard
              workout={todayWorkout}
              isCompleted={isTodayCompleted}
              xpToEarn={todayXP}
              onStart={handleStartWorkout}
            />
          </div>

          {/* Tomorrow Preview */}
          <div>
            <TomorrowPreviewCard
              workout={tomorrowWorkout}
              xpToEarn={tomorrowXP}
            />
          </div>
        </div>

        {/* Yesterday's Workout Card - Always show for testing */}
        {showYesterdayCard && (
          <div className="mb-8">
            <YesterdayMissedCard
              workout={yesterdayWorkout}
              xpAvailable={yesterdayXP}
              onComplete={handleCompleteYesterday}
              isCompleting={manualCompleteMutation.isPending}
              isCompleted={isYesterdayCompleted}
            />
          </div>
        )}

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WeeklyProgress
            sessionsThisWeek={gamificationData?.totalWorkoutsCompleted || 0}
            sessionsLastWeek={0} // TODO: Calculate from sessions data
            plannedThisWeek={workoutsPlannedThisWeek}
            totalXP={gamificationData?.xp || 0}
          />

          <ActivityHeatmap
            sessions={
              sessionsData?.sessions.map((session) => ({
                date: session.session_date,
                duration: session.duration_minutes,
                exercises_completed: session.exercises_completed.length,
              })) || []
            }
            weeksToShow={12}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Original Weekly Stats Card (for reference) */}
        <div className="mb-8 hidden">
          <WeeklyStatsCard
            workoutsCompleted={gamificationData?.totalWorkoutsCompleted || 0}
            workoutsPlanned={workoutsPlannedThisWeek}
            totalXP={gamificationData?.xp || 0}
            currentStreak={gamificationData?.currentStreak || 0}
            weekNumber={getCurrentWeek()}
          />
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
