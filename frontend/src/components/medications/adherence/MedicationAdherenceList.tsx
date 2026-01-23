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
import type { MedicationAdherence as MedicationAdherenceType } from '../../../types';

interface MedicationAdherenceListProps {
  medicationAdherence: MedicationAdherenceType[];
  onMedicationClick?: (medicationId: string) => void;
}

export const MedicationAdherenceList: React.FC<MedicationAdherenceListProps> = ({
  medicationAdherence,
  onMedicationClick,
}) => {
  const getAdherenceColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (medicationAdherence.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Per-Medication Stats
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">💊</div>
          <p>No medications with dose data yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Per-Medication Stats
      </h3>

      <div className="space-y-4">
        {medicationAdherence.map((med) => (
          <div
            key={med.medicationId}
            className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${
              onMedicationClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
            }`}
            onClick={() => onMedicationClick?.(med.medicationId)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {med.medicationName}
              </span>
              <span className={`font-bold ${getAdherenceColor(med.percentage)}`}>
                {med.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(med.percentage)}`}
                style={{ width: `${med.percentage}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">
                ✓ {med.taken} taken
              </span>
              <span className="text-red-600 dark:text-red-400">
                ✗ {med.missed} missed
              </span>
              {med.skipped > 0 && (
                <span className="text-gray-500 dark:text-gray-400">
                  ○ {med.skipped} skipped
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicationAdherenceList;
