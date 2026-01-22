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

import { Input } from '../../../design-system';
import type { StepContentProps } from './types';

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function Step5Schedule({ data, setData }: StepContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Workout Preferences</h3>
        <p className="text-neutral-600 mb-6">Help us tailor your workout plans</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            How many days per week do you want to work out?
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setData({ ...data, preferences: { ...data.preferences, workout_frequency: days } })}
                className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                  data.preferences.workout_frequency === days
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                {days}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Preferred workout duration (minutes)"
          type="number"
          placeholder="60"
          value={data.preferences.preferred_workout_duration || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setData({ ...data, preferences: { ...data.preferences, preferred_workout_duration: Number(e.target.value) } })
          }
        />
      </div>
    </div>
  );
}
