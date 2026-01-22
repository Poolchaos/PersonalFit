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

import { Check, X, Clock, AlertCircle, Pill } from 'lucide-react';
import { Card, CardContent, Button } from '../../design-system';
import type { Medication, TodaysDose } from '../../types';

interface MedicationDoseCardProps {
  medication: Medication;
  doses: TodaysDose[];
  onLogDose: (medicationId: string, scheduledTime: string, status: 'taken' | 'skipped') => void;
  isPending: boolean;
}

export default function MedicationDoseCard({
  medication,
  doses,
  onLogDose,
  isPending,
}: MedicationDoseCardProps) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusIcon = (status: TodaysDose['status']) => {
    switch (status) {
      case 'taken':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'skipped':
        return <X className="w-5 h-5 text-gray-400" />;
      case 'missed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBg = (status: TodaysDose['status']) => {
    switch (status) {
      case 'taken':
        return 'bg-green-50 border-green-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      case 'missed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const totalCount = doses.length;

  return (
    <Card className="overflow-hidden">
      <div
        className={`p-4 ${
          medication.type === 'prescription'
            ? 'bg-purple-600'
            : medication.type === 'supplement'
            ? 'bg-green-600'
            : 'bg-blue-600'
        } text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pill className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">{medication.name}</h3>
              <p className="text-sm opacity-90">
                {medication.dosage.amount} {medication.dosage.unit} • {medication.dosage.form}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {takenCount}/{totalCount}
            </div>
            <div className="text-sm opacity-90">doses taken</div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          {doses.map((dose, index) => (
            <div
              key={`${dose.scheduled_time}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusBg(
                dose.status
              )}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(dose.status)}
                <div>
                  <span className="font-medium">{formatTime(dose.scheduled_time)}</span>
                  {medication.frequency.with_food && (
                    <span className="text-xs text-gray-500 ml-2">with food</span>
                  )}
                </div>
              </div>
              {dose.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onLogDose(medication._id, dose.scheduled_time, 'taken')}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Take
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLogDose(medication._id, dose.scheduled_time, 'skipped')}
                    disabled={isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Skip
                  </Button>
                </div>
              )}
              {dose.status === 'missed' && (
                <Button
                  size="sm"
                  onClick={() => onLogDose(medication._id, dose.scheduled_time, 'taken')}
                  disabled={isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Take Late
                </Button>
              )}
              {(dose.status === 'taken' || dose.status === 'skipped') && (
                <span
                  className={`text-sm ${
                    dose.status === 'taken' ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {dose.status === 'taken' ? 'Completed' : 'Skipped'}
                </span>
              )}
            </div>
          ))}
        </div>
        {medication.warnings && medication.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Warnings:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {medication.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
