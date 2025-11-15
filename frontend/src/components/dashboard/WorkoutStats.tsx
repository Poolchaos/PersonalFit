import { TrendingUp, Dumbbell, Flame, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function StatItem({ icon: Icon, label, value, change, changeType = 'neutral' }: StatItemProps) {
  const changeColor = {
    positive: 'text-success-DEFAULT',
    negative: 'text-error-DEFAULT',
    neutral: 'text-neutral-500',
  }[changeType];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Icon size={20} className="text-primary-500" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
        )}
      </div>
      <div className="text-2xl font-bold text-neutral-900 mb-1">{value}</div>
      <div className="text-sm text-neutral-600">{label}</div>
    </motion.div>
  );
}

interface WorkoutStatsProps {
  totalWorkouts: number;
  thisWeek: number;
  totalVolume: string;
  consistency: string;
}

export function WorkoutStats({ totalWorkouts, thisWeek, totalVolume, consistency }: WorkoutStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatItem
        icon={Dumbbell}
        label="Total Workouts"
        value={totalWorkouts}
      />
      <StatItem
        icon={Flame}
        label="This Week"
        value={thisWeek}
        change="+2 from last week"
        changeType="positive"
      />
      <StatItem
        icon={TrendingUp}
        label="Total Volume"
        value={totalVolume}
      />
      <StatItem
        icon={Target}
        label="Consistency"
        value={consistency}
        change="↑ 5%"
        changeType="positive"
      />
    </div>
  );
}
