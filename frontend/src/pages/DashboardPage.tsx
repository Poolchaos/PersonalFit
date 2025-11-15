import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { HeroSection } from '../components/dashboard/HeroSection';
import { WorkoutStats } from '../components/dashboard/WorkoutStats';
import { Card, CardHeader, CardTitle, CardContent } from '../design-system';
import { profileAPI, accountabilityAPI, sessionAPI } from '../api';

export default function DashboardPage() {
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

  return (
    <Layout>
      <div>
        {/* Hero Section */}
        <HeroSection />

        {/* Workout Stats */}
        <div className="mb-8">
          <WorkoutStats
            totalWorkouts={accountabilityData?.totals.workouts_completed || 0}
            thisWeek={accountabilityData?.current_week.workouts_completed || 0}
            totalVolume="12,450 kg"
            consistency="85%"
          />
        </div>

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
    </Layout>
  );
}
