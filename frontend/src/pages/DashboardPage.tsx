import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { HeroSection } from '../components/dashboard/HeroSection';
import { WorkoutStats } from '../components/dashboard/WorkoutStats';
import VolumeChart from '../components/charts/VolumeChart';
import { PageTransition } from '../components/layout/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '../design-system';
import { profileAPI, accountabilityAPI, sessionAPI, workoutAPI, progressAPI } from '../api';

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

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionAPI.getAll,
  });

  const { data: workoutsData } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress'],
    queryFn: progressAPI.getStats,
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

  return (
    <Layout>
      <PageTransition>
        <div>
        {/* Hero Section */}
        <HeroSection />

        {/* Workout Stats */}
        <div className="mb-8">
          <WorkoutStats
            totalWorkouts={accountabilityData?.totals.workouts_completed || 0}
            thisWeek={accountabilityData?.current_week.workouts_completed || 0}
            totalVolume={progressData?.overall.total_volume_kg ? `${progressData.overall.total_volume_kg.toLocaleString()} kg` : '0 kg'}
            consistency={progressData?.overall.completion_rate ? `${Math.round(progressData.overall.completion_rate)}%` : '0%'}
          />
        </div>

        {/* Volume Progression Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Workout Volume Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VolumeChart workouts={workoutsData?.workouts || []} />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card hover>
            <div className="p-6">
              <h3 className="text-sm font-medium text-neutral-500">Workouts This Week</h3>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {accountabilityData?.current_week.workouts_completed || 0} / {accountabilityData?.current_week.workouts_planned || 0}
              </p>
            </div>
          </Card>

          <Card hover>
            <div className="p-6">
              <h3 className="text-sm font-medium text-neutral-500">Total Workouts</h3>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {accountabilityData?.totals.workouts_completed || 0}
              </p>
            </div>
          </Card>

          <Card hover>
            <div className="p-6">
              <h3 className="text-sm font-medium text-neutral-500">Workouts Missed</h3>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {accountabilityData?.current_week.workouts_missed || 0}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {profileData?.user.profile.first_name || 'Not set'} {profileData?.user.profile.last_name || ''}</p>
                <p><span className="font-medium">Goals:</span> {profileData?.user.profile.fitness_goals?.join(', ') || 'Not set'}</p>
                <p><span className="font-medium">Experience:</span> {profileData?.user.profile.experience_level || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsData?.sessions.slice(0, 5).map((session) => (
                <div key={session._id} className="py-2 border-b last:border-0">
                  <p className="text-sm font-medium">{session.session_date}</p>
                  <p className="text-xs text-neutral-600">{session.duration_minutes} minutes</p>
                </div>
              )) || <p className="text-sm text-neutral-500">No recent activity</p>}
            </CardContent>
          </Card>
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
