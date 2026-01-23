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

import React, { useState } from 'react';
import { Gift, Gem, TrendingUp, Zap } from 'lucide-react';

interface AdherenceReward {
  xpAwarded: number;
  gemsAwarded: number;
  reason: string;
  adherenceRate: number;
}

interface AdherenceRewardsProps {
  eligibleRewards?: AdherenceReward[];
  onClaimRewards?: () => void;
  loading?: boolean;
}

export const AdherenceRewards: React.FC<AdherenceRewardsProps> = ({
  eligibleRewards = [],
  onClaimRewards,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!eligibleRewards || eligibleRewards.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Gift className="w-5 h-5" />
          <p className="font-medium">No rewards available right now. Keep up your adherence!</p>
        </div>
      </div>
    );
  }

  const totalXp = eligibleRewards.reduce((sum, r) => sum + r.xpAwarded, 0);
  const totalGems = eligibleRewards.reduce((sum, r) => sum + r.gemsAwarded, 0);

  return (
    <div className="w-full space-y-3">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-yellow-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {eligibleRewards.length} Reward{eligibleRewards.length !== 1 ? 's' : ''} Available!
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Reward Summary */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP to Earn</p>
              <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{totalXp}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
            <Gem className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Gems to Earn</p>
              <p className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{totalGems}</p>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaimRewards}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-2">
          {eligibleRewards.map((reward, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {reward.reason}
                  </h4>
                  {reward.adherenceRate > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Adherence: {reward.adherenceRate.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    +{reward.xpAwarded} XP
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-sm">
                  <Gem className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                    +{reward.gemsAwarded} Gems
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdherenceRewards;
