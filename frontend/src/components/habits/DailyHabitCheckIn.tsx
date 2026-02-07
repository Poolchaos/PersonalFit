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

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Droplets, Moon, Coffee, Smartphone, Footprints } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../design-system';
import { analyticsAPI, healthEcosystemAPI } from '../../api';
import type { HabitEntry } from '../../types';

const defaultHabits = [
  {
    key: 'hydration',
    label: 'Hydration goal met',
    category: 'good' as const,
    icon: Droplets,
  },
  {
    key: 'sleep_schedule',
    label: 'Consistent sleep schedule',
    category: 'good' as const,
    icon: Moon,
  },
  {
    key: 'movement_breaks',
    label: 'Movement breaks taken',
    category: 'good' as const,
    icon: Footprints,
  },
  {
    key: 'late_caffeine',
    label: 'Late caffeine avoided',
    category: 'bad' as const,
    icon: Coffee,
  },
  {
    key: 'screen_time',
    label: 'Screen time within limit',
    category: 'bad' as const,
    icon: Smartphone,
  },
];

export function DailyHabitCheckIn() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const mutation = useMutation({
    mutationFn: (entries: HabitEntry[]) => healthEcosystemAPI.upsertHabitLog(today, entries),
    onSuccess: (_, variables) => {
      analyticsAPI.trackEvent('habit_checkin_saved', {
        date: today,
        entries: variables.length,
      });
      toast.success('Habits saved for today');
    },
    onError: () => toast.error('Failed to save habits'),
  });

  const handleToggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const entries: HabitEntry[] = defaultHabits.map((habit) => ({
      habit_key: habit.key,
      category: habit.category,
      status: checked[habit.key] ? 'completed' : 'skipped',
    }));

    mutation.mutate(entries);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Habit Check‑In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {defaultHabits.map((habit) => {
            const Icon = habit.icon;
            const isChecked = !!checked[habit.key];
            return (
              <label key={habit.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{habit.label}</p>
                    <p className="text-xs text-neutral-500">
                      {habit.category === 'good' ? 'Build momentum' : 'Reduce friction'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  checked={isChecked}
                  onChange={() => handleToggle(habit.key)}
                />
              </label>
            );
          })}
        </div>

        <Button className="w-full" onClick={handleSave} loading={mutation.isPending}>
          Save Today’s Habits
        </Button>
      </CardContent>
    </Card>
  );
}
