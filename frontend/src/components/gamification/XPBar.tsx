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

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Gem } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { Leaderboard } from './Leaderboard';
import { RewardsShop } from './RewardsShop';

export function XPBar() {
  const { level, xp, xpToNextLevel, xpProgress, gems } = useGamification();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);

  return (
    <>
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

        {/* Quick Stats & Actions */}
        <div className="flex items-center gap-2 pl-3 border-l border-neutral-200">
          <div className="flex items-center gap-1 text-xs">
            <Zap size={14} className="text-xp-DEFAULT" />
            <span className="font-medium text-neutral-700">{xp} XP</span>
          </div>

          {/* Gems - Opens Shop */}
          <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border border-cyan-200 px-3 py-1.5 rounded-full transition-all hover:shadow-md cursor-pointer"
            title="Open Rewards Shop"
          >
            <Gem size={14} className="text-cyan-500" />
            <span className="font-semibold text-cyan-700">{gems}</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center justify-center p-1.5 text-xs bg-gradient-to-r from-yellow-50 to-amber-100 hover:from-yellow-100 hover:to-amber-200 border border-yellow-200 rounded-full transition-all hover:shadow-md cursor-pointer"
            title="View Leaderboard"
          >
            <Trophy size={14} className="text-yellow-600" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showShop && <RewardsShop currentGems={gems} onClose={() => setShowShop(false)} />}
    </>
  );
}
