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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Pill, Check, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button } from '../../design-system';
import { medicationAPI, medicationQueryKeys } from '../../api';
import type { TodaysMedication } from '../../types';

export function MedicationsWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: medicationQueryKeys.today(),
    queryFn: medicationAPI.getTodaysDoses,
  });

  const logDoseMutation = useMutation({
    mutationFn: ({
      medicationId,
      scheduledTime,
    }: {
      medicationId: string;
      scheduledTime: string;
    }) =>
      medicationAPI.logDose(medicationId, {
        scheduled_time: scheduledTime,
        status: 'taken',
      }),
    onSuccess: () => {
      toast.success('Dose logged!');
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.today() });
    },
    onError: () => {
      toast.error('Failed to log dose');
    },
  });

  const todaysMedications: TodaysMedication[] = data?.todaysDoses || [];

  // Calculate stats
  const totalDoses = todaysMedications.reduce((acc, med) => acc + med.doses.length, 0);
  const takenDoses = todaysMedications.reduce(
    (acc, med) => acc + med.doses.filter((d) => d.status === 'taken').length,
    0
  );
  const pendingDoses = todaysMedications.reduce(
    (acc, med) => acc + med.doses.filter((d) => d.status === 'pending').length,
    0
  );

  // Get next pending dose
  const getNextPendingDose = () => {
    for (const med of todaysMedications) {
      for (const dose of med.doses) {
        if (dose.status === 'pending') {
          return { medication: med.medication, dose };
        }
      }
    }
    return null;
  };

  const nextDose = getNextPendingDose();

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  // No medications added yet
  if (todaysMedications.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            Medications & Supplements
          </h3>
        </div>
        <p className="text-gray-600 mb-4">
          Track your medications and supplements to see how they affect your fitness.
        </p>
        <Link to="/medications">
          <Button variant="outline" className="w-full">
            <Pill className="w-4 h-4 mr-2" />
            Add Your First Medication
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          Today's Medications
        </h3>
        <Link
          to="/medications"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {takenDoses}/{totalDoses} doses
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Next Pending Dose */}
      {nextDose ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{nextDose.medication.name}</p>
                <p className="text-sm text-gray-500">
                  {nextDose.medication.dosage.amount} {nextDose.medication.dosage.unit} •{' '}
                  {formatTime(nextDose.dose.scheduled_time)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                logDoseMutation.mutate({
                  medicationId: nextDose.medication._id,
                  scheduledTime: nextDose.dose.scheduled_time,
                })
              }
              disabled={logDoseMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Take
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-800">All done for today!</p>
          <p className="text-sm text-green-600">Great job staying consistent 💪</p>
        </div>
      )}

      {/* Quick Stats */}
      {pendingDoses > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          {pendingDoses} dose{pendingDoses > 1 ? 's' : ''} remaining today
        </div>
      )}
    </Card>
  );
}
