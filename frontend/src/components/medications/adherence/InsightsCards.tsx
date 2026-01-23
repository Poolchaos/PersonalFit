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

import React from 'react';
import type { AdherenceInsight } from '../../../types';

interface InsightsCardsProps {
  insights: AdherenceInsight[];
  onActionClick?: (insight: AdherenceInsight) => void;
}

export const InsightsCards: React.FC<InsightsCardsProps> = ({
  insights,
  onActionClick,
}) => {
  const getSeverityStyles = (severity: AdherenceInsight['severity']) => {
    switch (severity) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          icon: '✓',
          iconBg: 'bg-green-100 dark:bg-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-700',
          icon: '!',
          iconBg: 'bg-amber-100 dark:bg-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          icon: 'i',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const getActionLabel = (actionType?: AdherenceInsight['actionType']): string => {
    switch (actionType) {
      case 'set_reminder':
        return 'Set Reminder';
      case 'change_time':
        return 'Change Time';
      case 'view_medication':
        return 'View Details';
      default:
        return 'Learn More';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Insights
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>Keep logging your doses to get personalized insights!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Insights & Tips
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const styles = getSeverityStyles(insight.severity);

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
                >
                  <span className={`font-bold ${styles.iconColor}`}>
                    {styles.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {insight.message}
                  </p>
                  {insight.suggestion && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      💡 {insight.suggestion}
                    </p>
                  )}

                  {/* Action Button */}
                  {insight.actionType && onActionClick && (
                    <button
                      onClick={() => onActionClick(insight)}
                      className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {getActionLabel(insight.actionType)} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsCards;
