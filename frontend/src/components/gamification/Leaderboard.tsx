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

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, TrendingUp, X, Medal, Loader2, AlertCircle } from 'lucide-react';
import { gamificationAPI } from '../../api/gamification';
import type { LeaderboardEntry } from '../../api/gamification';

interface LeaderboardProps {
  onClose?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'weekly'>('global');

  // Fetch leaderboard data
  const { data: globalData, isLoading: globalLoading, error: globalError } = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: () => gamificationAPI.getGlobalLeaderboard(50, 0),
    staleTime: 30000, // 30 seconds
  });

  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useQuery({
    queryKey: ['leaderboard', 'weekly'],
    queryFn: () => gamificationAPI.getWeeklyLeaderboard(50, 0),
    staleTime: 30000,
    enabled: leaderboardType === 'weekly', // Only fetch when tab is active
  });

  const isLoading = leaderboardType === 'global' ? globalLoading : weeklyLoading;
  const error = leaderboardType === 'global' ? globalError : weeklyError;
  const leaderboard = leaderboardType === 'global'
    ? globalData?.leaderboard || []
    : weeklyData?.leaderboard || [];
  const userRank = leaderboardType === 'global'
    ? globalData?.userRank
    : weeklyData?.userRank;

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-neutral-400';
      case 3:
        return 'text-orange-500';
      default:
        return 'text-neutral-400';
    }
  };

  const renderMedal = (rank: number) => {
    if (rank <= 3) {
      return <Medal className={`w-7 h-7 ${getMedalColor(rank)}`} />;
    }
    return (
      <span className="text-lg font-bold text-neutral-400">#{rank}</span>
    );
  };

  const getLevelColor = (level: number): string => {
    if (level >= 20) return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (level >= 15) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (level >= 10) return 'bg-green-100 text-green-700 border border-green-200';
    return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
  };

  return (
    // Modal overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {/* Modal content */}
      <div className="w-full max-w-2xl h-[90vh] bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between p-6 bg-white border-b border-neutral-200 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Leaderboard</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Close leaderboard"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(['global', 'weekly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setLeaderboardType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  leaderboardType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {type === 'global' ? 'Global' : 'Weekly'}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
              <p className="text-neutral-500">Loading leaderboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-neutral-700 font-medium">Failed to load leaderboard</p>
              <p className="text-sm text-neutral-500 mt-1">Please try again later</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && leaderboard.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-neutral-700 font-medium">No competitors yet</p>
              <p className="text-sm text-neutral-500 mt-1">Complete workouts to appear on the leaderboard!</p>
            </div>
          )}

          {/* Leaderboard Table */}
          {!isLoading && !error && leaderboard.length > 0 && (
            <div className="space-y-2">
              {leaderboard.map((entry: LeaderboardEntry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 flex items-center justify-center">
                    {renderMedal(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-900">
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded border border-primary-200">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {entry.totalWorkouts} workouts
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {/* Level */}
                    <div className={`px-3 py-1 rounded-full font-semibold ${getLevelColor(entry.level)}`}>
                      Lv {entry.level}
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1 text-orange-600">
                      <Flame className="w-4 h-4" />
                      <span className="font-semibold">{entry.currentStreak}</span>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 text-primary-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{(entry.xp / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-none px-6 py-4 border-t border-neutral-200 bg-white rounded-b-xl text-center text-sm text-neutral-500">
          {userRank && <p className="font-medium text-neutral-700 mb-1">Your rank: #{userRank}</p>}
          <p>Compete globally and climb the leaderboard to earn rewards!</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
