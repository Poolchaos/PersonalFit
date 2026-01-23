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
import { useQuery } from '@tanstack/react-query';
import { medicationAPI, medicationQueryKeys } from '../../api/medications';
import {
  StreakTracker,
  WeeklyCalendar,
  InsightsCards,
  MonthlyChart,
  MedicationAdherenceList,
} from './adherence';
import type { AdherenceInsight } from '../../types';

interface AdherenceTabProps {
  onMedicationClick?: (medicationId: string) => void;
}

export const AdherenceTab: React.FC<AdherenceTabProps> = ({ onMedicationClick }) => {
  const [timeRange, setTimeRange] = useState<number>(30);

  const { data, isLoading, error } = useQuery({
    queryKey: medicationQueryKeys.adherence(timeRange),
    queryFn: () => medicationAPI.getAdherenceOverview(timeRange),
  });

  const handleInsightAction = (insight: AdherenceInsight) => {
    if (insight.actionType === 'view_medication' && insight.actionData?.medicationId) {
      onMedicationClick?.(insight.actionData.medicationId as string);
    }
    // TODO: Handle other action types (set_reminder, change_time)
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Failed to load adherence data
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
          Please try again later.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No adherence data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Adherence Dashboard
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overall Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.overallStats.thisWeek.percentage}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {data.overallStats.thisWeek.taken}/{data.overallStats.thisWeek.total} doses
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.overallStats.thisMonth.percentage}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">This Month</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {data.overallStats.thisMonth.taken}/{data.overallStats.thisMonth.total} doses
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.overallStats.allTime.percentage}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">All Time</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {data.overallStats.allTime.taken}/{data.overallStats.allTime.total} doses
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak Tracker */}
        <StreakTracker streak={data.streak} />

        {/* Weekly Calendar */}
        <WeeklyCalendar weeklyAdherence={data.weeklyAdherence} />

        {/* Monthly Chart */}
        <MonthlyChart monthlyAdherence={data.monthlyAdherence} />

        {/* Insights */}
        <InsightsCards
          insights={data.insights}
          onActionClick={handleInsightAction}
        />

        {/* Per-Medication Stats */}
        <div className="lg:col-span-2">
          <MedicationAdherenceList
            medicationAdherence={data.medicationAdherence}
            onMedicationClick={onMedicationClick}
          />
        </div>
      </div>
    </div>
  );
};

export default AdherenceTab;
