import { Card } from '../../design-system';
import { TrendingUp, Flame, Target, Award, Calendar } from 'lucide-react';

interface WeeklyStatsCardProps {
  workoutsCompleted: number;
  workoutsPlanned: number;
  totalXP: number;
  currentStreak: number;
  weekNumber: number;
}

export function WeeklyStatsCard({
  workoutsCompleted,
  workoutsPlanned,
  totalXP,
  currentStreak,
  weekNumber,
}: WeeklyStatsCardProps) {
  const completionRate = workoutsPlanned > 0 ? Math.round((workoutsCompleted / workoutsPlanned) * 100) : 0;

  // Determine streak color and message
  const getStreakStyle = () => {
    if (currentStreak >= 30) return { color: 'text-purple-600', bg: 'bg-purple-100', emoji: '🔥', label: 'LEGENDARY' };
    if (currentStreak >= 7) return { color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🔥', label: 'ON FIRE' };
    if (currentStreak >= 3) return { color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⚡', label: 'HEATING UP' };
    return { color: 'text-blue-600', bg: 'bg-blue-100', emoji: '💪', label: 'BUILDING' };
  };

  const streakStyle = getStreakStyle();

  return (
    <Card className="bg-gradient-to-br from-white to-neutral-50 border-2 border-neutral-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Week {weekNumber} Summary
            </h3>
            <p className="text-sm text-neutral-500 mt-1">Your progress this week</p>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Workout Completion</span>
            <span className="text-sm font-bold text-primary-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${completionRate}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {workoutsCompleted} of {workoutsPlanned} workouts completed
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* XP Earned */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-xs text-yellow-700 font-medium mb-1">XP Earned</p>
              <p className="text-2xl font-bold text-yellow-900">{totalXP}</p>
            </div>
          </div>

          {/* Current Streak */}
          <div className={`bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border ${
            currentStreak >= 7 ? 'border-orange-300 ring-2 ring-orange-200' : 'border-orange-200'
          }`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 ${streakStyle.bg} rounded-full flex items-center justify-center mb-2`}>
                <Flame className={`w-5 h-5 ${streakStyle.color}`} />
              </div>
              <p className={`text-xs font-medium mb-1 ${streakStyle.color}`}>
                {streakStyle.label}
              </p>
              <p className="text-2xl font-bold text-orange-900 flex items-center gap-1">
                {currentStreak}
                <span className="text-lg">{streakStyle.emoji}</span>
              </p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-green-700 font-medium mb-1">Rate</p>
              <p className="text-2xl font-bold text-green-900">{completionRate}%</p>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        {completionRate === 100 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-success-100 to-green-100 rounded-lg border border-success-300">
            <p className="text-sm text-success-800 font-semibold text-center flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Perfect week! Keep the momentum going! 🎉
            </p>
          </div>
        )}

        {completionRate >= 75 && completionRate < 100 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-100 to-blue-100 rounded-lg border border-primary-300">
            <p className="text-sm text-primary-800 font-semibold text-center">
              Great progress! You're crushing it! 💪
            </p>
          </div>
        )}

        {completionRate < 75 && completionRate > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
            <p className="text-sm text-yellow-800 font-semibold text-center">
              Keep pushing! Every workout counts! 🔥
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
