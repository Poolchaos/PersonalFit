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

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Pill, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../design-system';
import { medicationAPI, medicationQueryKeys } from '../../api';
import type { ScheduleWorkout } from '../../types';

interface TodayHealthLoopProps {
  todayWorkout?: ScheduleWorkout | null;
  habitsEnabled?: boolean;
  dietEnabled?: boolean;
}

export function TodayHealthLoop({ todayWorkout, habitsEnabled, dietEnabled }: TodayHealthLoopProps) {
  const { data } = useQuery({
    queryKey: medicationQueryKeys.today(),
    queryFn: medicationAPI.getTodaysDoses,
  });

  const pendingDoses = useMemo(() => {
    const todays = data?.todaysDoses || [];
    return todays.reduce(
      (acc, med) => acc + med.doses.filter((dose) => dose.status === 'pending').length,
      0
    );
  }, [data]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          Today’s Health Loop
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-neutral-900">Workout</span>
            </div>
            <p className="text-sm text-neutral-600">
              {todayWorkout ? todayWorkout.name : 'Rest day or no plan'}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-neutral-900">Medication</span>
            </div>
            <p className="text-sm text-neutral-600">
              {pendingDoses > 0 ? `${pendingDoses} dose${pendingDoses === 1 ? '' : 's'} pending` : 'All doses on track'}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-neutral-900">Habits</span>
            </div>
            <p className="text-sm text-neutral-600">
              {habitsEnabled ? 'Check in to build momentum' : 'Enable in settings'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {habitsEnabled && (
            <Button variant="outline" onClick={() => scrollToId('habit-check-in')}>
              Open Habit Check‑In
            </Button>
          )}
          {dietEnabled && (
            <Button variant="outline" onClick={() => scrollToId('vision-scan')}>
              Upload a Fridge Scan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
