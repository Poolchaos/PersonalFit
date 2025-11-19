import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

export function XPBar() {
  const { level, xp, xpToNextLevel, xpProgress } = useGamification();

  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm">
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
          {level}
        </div>
        <div className="text-sm">
          <p className="font-semibold text-neutral-900">Level {level}</p>
          <p className="text-xs text-neutral-500">
            {xp}/{xpToNextLevel} XP
          </p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(xpProgress, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
        />
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-3 pl-3 border-l border-neutral-200">
        <div className="flex items-center gap-1 text-xs">
          <Zap size={14} className="text-xp-DEFAULT" />
          <span className="font-medium text-neutral-700">{xp} XP</span>
        </div>
      </div>
    </div>
  );
}
