import { useQuery } from '@tanstack/react-query';
import { Flame, Award, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { accountabilityAPI } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../design-system/components/Card';
import { StreakWidget } from '../components/gamification/StreakWidget';
import { PageTransition } from '../components/layout/PageTransition';
import { StreakCardSkeleton } from '../design-system';

export default function AccountabilityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['accountability'],
    queryFn: accountabilityAPI.getStatus,
  });

  const { data: penaltiesData, isLoading: penaltiesLoading } = useQuery({
    queryKey: ['penalties'],
    queryFn: accountabilityAPI.getPenalties,
  });

  // Generate last 7 days for calendar
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      // Mock workout completion - replace with real data from API
      hasWorkout: i < (data?.streak.current || 0),
    };
  });

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">Accountability</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* StreakWidget - takes 1 column */}
          <div className="lg:col-span-1">
            {isLoading ? <StreakCardSkeleton /> : <StreakWidget />}
          </div>

          {/* Summary Stats - takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <>
                <StreakCardSkeleton />
                <StreakCardSkeleton />
              </>
            ) : (
              <>
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-sm text-gray-600 mb-1">Workouts Completed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {data?.totals.workouts_completed || 0}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50">
                    <p className="text-sm text-gray-600 mb-1">Workouts Missed</p>
                    <p className="text-3xl font-bold text-red-600">
                      {data?.totals.workouts_missed || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  This Week's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Planned</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.current_week.workouts_planned || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.current_week.workouts_completed || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Missed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {data?.current_week.workouts_missed || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round((data?.current_week.completion_rate || 0) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </div>
        </div>

        {/* Week Calendar Visual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {last7Days.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-gray-500 mb-2">{day.day}</p>
                  <div
                    className={`aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                      day.hasWorkout
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    {day.hasWorkout ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{day.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Penalties */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-600">Active Penalties</CardTitle>
          </CardHeader>
          <CardContent>
            {penaltiesLoading ? (
              <StreakCardSkeleton />
            ) : penaltiesData?.penalties.filter(p => !p.completed).length ? (
              <div className="space-y-3">
                {penaltiesData.penalties
                  .filter(p => !p.completed)
                  .map((penalty) => (
                    <div key={penalty._id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">{penalty.penalty_type}</p>
                          <p className="text-sm text-red-700 mt-1">{penalty.description}</p>
                          <p className="text-xs text-gray-600 mt-2">
                            Missed: {new Date(penalty.missed_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs bg-red-200 text-red-800 px-3 py-1 rounded-full font-medium">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">No active penalties. Keep it up!</p>
                <p className="text-sm mt-1">Stay consistent with your workouts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Penalties */}
        {penaltiesData?.penalties.filter(p => p.completed).length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Completed Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {penaltiesData.penalties
                  .filter(p => p.completed)
                  .slice(0, 5)
                  .map((penalty) => (
                    <div key={penalty._id} className="bg-green-50 p-3 rounded-md border-l-4 border-green-500">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-green-800">{penalty.penalty_type}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Completed: {penalty.completed_date ? new Date(penalty.completed_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
      </PageTransition>
    </Layout>
  );
}
