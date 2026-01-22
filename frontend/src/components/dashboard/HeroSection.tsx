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

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useStreak } from '../../hooks/useStreak';
import { useGamification } from '../../hooks/useGamification';
import { getGamificationIcon } from '../../utils/imageHelpers';

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

  // Dynamic background image based on workout status
  const getHeroImage = () => {
    if (currentStreak >= 7) {
      return '/images/dashboard/hero-achievement.jpg';
    } else if (currentStreak === 0) {
      return '/images/dashboard/hero-rest-day.jpg';
    }
    return '/images/dashboard/hero-workout-motivation.jpg';
  };

  return (
    <div
      className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-6 md:p-8 text-white mb-6 shadow-xl overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(0, 184, 230, 0.85), rgba(0, 153, 204, 0.9)), url('${getHeroImage()}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, {firstName}!
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
            <img
              src={getGamificationIcon('streak')}
              alt="Streak"
              className="w-16 h-16 drop-shadow-glow"
            />
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
