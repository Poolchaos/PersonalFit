import { Flame, Snowflake, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStreak } from '../../hooks/useStreak';
import { Card, CardHeader, CardTitle, CardContent } from '../../design-system';

export function StreakWidget() {
  const { currentStreak, longestStreak, freezesAvailable, nextMilestone } = useStreak();

  return (
    <Card hover className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Workout Streak</CardTitle>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Flame size={32} className="drop-shadow-lg" />
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-neutral-900 mb-2">{currentStreak}</div>
          <p className="text-neutral-600 font-medium">Day Streak</p>
          <p className="text-sm text-neutral-500 mt-1">
            Best: {longestStreak} days
          </p>
        </div>

        {/* Progress to Next Milestone */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-600">Next milestone</span>
            <span className="font-medium text-neutral-900">{nextMilestone} days</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {nextMilestone - currentStreak} days to go
          </p>
        </div>

        {/* Streak Freezes */}
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Snowflake size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-neutral-700">Streak Freezes</span>
            </div>
            <span className="text-sm font-bold text-neutral-900">{freezesAvailable}</span>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < freezesAvailable ? 'bg-blue-500' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Protect your streak when you need a rest day
          </p>
        </div>

        {/* Streak Calendar Preview */}
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Last 7 Days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => {
              const isComplete = i < currentStreak;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                    isComplete
                      ? 'bg-success-DEFAULT text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isComplete ? '✓' : '•'}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
