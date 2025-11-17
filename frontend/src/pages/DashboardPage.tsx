import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { HeroSection } from '../components/dashboard/HeroSection';
import { TodayWorkoutCard } from '../components/dashboard/TodayWorkoutCard';
import { TomorrowPreviewCard } from '../components/dashboard/TomorrowPreviewCard';
import { WeeklyStatsCard } from '../components/dashboard/WeeklyStatsCard';
import { XPProgressBar } from '../components/gamification/XPProgressBar';
import { StreakCounter } from '../components/gamification/StreakCounter';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../design-system';
import { profileAPI, accountabilityAPI, workoutAPI, gamificationAPI } from '../api';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile,
  });

  const { data: accountabilityData } = useQuery({
    queryKey: ['accountability'],
    queryFn: accountabilityAPI.getStatus,
  });

  const { data: workoutsData } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const { data: gamificationData } = useQuery({
    queryKey: ['gamification'],
    queryFn: gamificationAPI.getStats,
  });

  // Check if profile is incomplete
  const isProfileIncomplete =
    profileData &&
    (!profileData.user.profile.first_name ||
      !profileData.user.profile.fitness_goals ||
      profileData.user.profile.fitness_goals.length === 0);

  // Auto-redirect to onboarding for new users
  useEffect(() => {
    if (isProfileIncomplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [isProfileIncomplete, navigate]);

  // Extract today and tomorrow workouts from the active plan
  const { todayWorkout, tomorrowWorkout } = useMemo(() => {
    if (workoutsData?.workouts && workoutsData.workouts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activePlan: any = workoutsData.workouts.find((w: any) => w.is_active);
      if (activePlan?.plan_data?.weekly_schedule) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const schedule: any[] = activePlan.plan_data.weekly_schedule;
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' });

        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          todayWorkout: schedule.find((s: any) => s.day === today) || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tomorrowWorkout: schedule.find((s: any) => s.day === tomorrow) || null,
        };
      }
    }
    return { todayWorkout: null, tomorrowWorkout: null };
  }, [workoutsData]);  // Show loading state while checking profile
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

  const todayXP = todayWorkout ? todayWorkout.workout.exercises.length * 10 : 0;
  const tomorrowXP = tomorrowWorkout ? tomorrowWorkout.workout.exercises.length * 10 : 0;
  const isTodayCompleted = false; // TODO: Check from sessions data

  const handleStartWorkout = () => {
    navigate('/workouts');
  };

  // Get current week number
  const getCurrentWeek = () => {
    const onejan = new Date(new Date().getFullYear(), 0, 1);
    return Math.ceil((((new Date().getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
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
              showAnimation={true}
            />
          </Card>

          {/* Streak Counter */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Consistency Streak</h3>
            <StreakCounter
              currentStreak={gamificationData?.current_streak || 0}
              longestStreak={gamificationData?.longest_streak || 0}
            />
          </Card>
        </div>

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

        {/* Weekly Stats */}
        <div className="mb-8">
          <WeeklyStatsCard
            workoutsCompleted={accountabilityData?.current_week.workouts_completed || 0}
            workoutsPlanned={accountabilityData?.current_week.workouts_planned || 0}
            totalXP={gamificationData?.xp || 0}
            currentStreak={gamificationData?.current_streak || 0}
            weekNumber={getCurrentWeek()}
          />
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
