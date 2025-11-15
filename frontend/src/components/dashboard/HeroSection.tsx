import { motion } from 'framer-motion';
import { Flame, Trophy, TrendingUp, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useStreak } from '../../hooks/useStreak';
import { useGamification } from '../../hooks/useGamification';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center"
    >
      <Icon size={24} className="mx-auto mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-primary-100">{label}</p>
    </motion.div>
  );
}

export function HeroSection() {
  const { user } = useAuthStore();
  const { currentStreak, longestStreak } = useStreak();
  const { level, xp, totalPRs } = useGamification();

  const firstName = user?.profile?.first_name || 'there';

  return (
    <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-6 md:p-8 text-white mb-6 shadow-xl">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-primary-100 text-lg">
          Let's crush today's workout
        </p>
      </motion.div>

      {/* Streak Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
        className="mt-6 flex items-center gap-4"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Flame size={64} className="text-orange-400 drop-shadow-glow" />
          </motion.div>
          {currentStreak > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                {currentStreak}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold">{currentStreak} Day Streak</p>
          <p className="text-primary-100">
            Personal best: {longestStreak} days
          </p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard icon={Trophy} label="Level" value={level} />
        <StatCard icon={Zap} label="XP" value={xp} />
        <StatCard icon={TrendingUp} label="PRs" value={totalPRs} />
      </div>
    </div>
  );
}
