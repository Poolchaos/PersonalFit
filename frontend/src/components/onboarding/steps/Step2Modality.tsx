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

import { Dumbbell, Zap, Target } from 'lucide-react';
import type { StepContentProps } from './types';

export function Step2Modality({ data, setData }: StepContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Choose Your Training Focus</h3>
        <p className="text-neutral-600 mb-6">What type of workout are you most interested in?</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setData({ ...data, workout_modality: 'strength' })}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
            data.workout_modality === 'strength'
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-200 hover:border-primary-300'
          }`}
        >
          <Dumbbell className="w-8 h-8 text-primary-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-lg mb-1">Strength Training</div>
            <div className="text-sm text-neutral-600">
              Build muscle, increase strength, and improve body composition with resistance exercises
            </div>
          </div>
        </button>

        <button
          onClick={() => setData({ ...data, workout_modality: 'cardio' })}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
            data.workout_modality === 'cardio'
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-200 hover:border-primary-300'
          }`}
        >
          <Zap className="w-8 h-8 text-primary-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-lg mb-1">Cardio Training</div>
            <div className="text-sm text-neutral-600">
              Improve endurance and heart health with walking, jogging, jump rope, and interval training
            </div>
          </div>
        </button>

        <button
          onClick={() => setData({ ...data, workout_modality: 'hybrid' })}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
            data.workout_modality === 'hybrid'
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-200 hover:border-primary-300'
          }`}
        >
          <Target className="w-8 h-8 text-primary-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-lg mb-1">Hybrid Training</div>
            <div className="text-sm text-neutral-600">
              Combine strength and cardio for balanced fitness, weight loss, and overall athleticism
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
