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

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface UpcomingDose {
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  dosage: {
    amount: number;
    unit: string;
    form: string;
  };
  minutesUntil: number;
  withFood?: boolean;
}

const MedicationReminderBanner: React.FC = () => {
  const [upcomingDoses, setUpcomingDoses] = useState<UpcomingDose[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const checkUpcomingDoses = useCallback(async () => {
    if (dismissed) return; // Skip if already dismissed

    try {
      const response = await apiClient.get('/api/medications');
      const medications = response.data.medications || [];

      const now = new Date();
      const upcoming: UpcomingDose[] = [];

      for (const med of medications) {
        if (!med.frequency?.specific_times) continue;

        for (const timeString of med.frequency.specific_times) {
          const [hours, minutes] = timeString.split(':').map(Number);
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Check if within 30 minutes
          const diff = scheduledTime.getTime() - now.getTime();
          const minutesUntil = Math.floor(diff / (1000 * 60));

          if (minutesUntil >= 0 && minutesUntil <= 30) {
            // Check if already logged today
            const alreadyLogged = med.dose_history?.some(
              (dose: { logged_at: string | Date }) => {
                const doseDate = new Date(dose.logged_at);
              const schedDate = scheduledTime;
              return (
                doseDate.getDate() === schedDate.getDate() &&
                doseDate.getMonth() === schedDate.getMonth() &&
                doseDate.getFullYear() === schedDate.getFullYear() &&
                Math.abs(doseDate.getTime() - schedDate.getTime()) <=
                  60 * 60 * 1000 // Within 1 hour
              );
            });

            if (!alreadyLogged) {
              upcoming.push({
                medicationId: med._id,
                medicationName: med.name,
                scheduledTime: timeString,
                dosage: med.dosage,
                minutesUntil,
                withFood: med.frequency.with_food,
              });
            }
          }
        }
      }

      // Sort by minutes until
      upcoming.sort((a, b) => a.minutesUntil - b.minutesUntil);

      setUpcomingDoses(upcoming);

      // Reset dismissed state if there are new doses
      if (upcoming.length > 0 && dismissed) {
        setDismissed(false);
      }
    } catch (error) {
      console.error('Error checking upcoming doses:', error);
    }
  }, [dismissed]);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      checkUpcomingDoses();
    }, 0);

    // Check every minute
    const interval = setInterval(checkUpcomingDoses, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkUpcomingDoses]);

  const handleViewMedications = () => {
    navigate('/medications');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (upcomingDoses.length === 0 || dismissed) {
    return null;
  }

  const primaryDose = upcomingDoses[0];
  const additionalCount = upcomingDoses.length - 1;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 animate-slide-down">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg border border-primary-400 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Pill className="w-4 h-4 text-white" />
                  <h3 className="text-white font-semibold">
                    Medication Reminder
                  </h3>
                </div>

                <p className="text-white/90 text-sm font-medium">
                  {primaryDose.medicationName} •{' '}
                  {primaryDose.dosage.amount} {primaryDose.dosage.unit}{' '}
                  {primaryDose.dosage.form}
                </p>

                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-white/80 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>
                      {primaryDose.minutesUntil === 0
                        ? 'Now'
                        : `in ${primaryDose.minutesUntil} min`}{' '}
                      ({primaryDose.scheduledTime})
                    </span>
                  </div>

                  {primaryDose.withFood && (
                    <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Take with food
                    </span>
                  )}
                </div>

                {additionalCount > 0 && (
                  <p className="text-white/70 text-xs mt-2">
                    + {additionalCount} more{' '}
                    {additionalCount === 1 ? 'medication' : 'medications'} due
                    soon
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="ml-4 text-white/80 hover:text-white transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={handleViewMedications}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white text-primary-600 hover:bg-white/90 rounded-lg font-medium text-sm transition-colors"
            >
              Log Doses
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-white/90 hover:text-white text-sm font-medium transition-colors"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationReminderBanner;
