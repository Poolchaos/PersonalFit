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

import type { StepContentProps } from './types';

const EXPERIENCE_LEVELS = [
  { value: 'beginner' as const, label: 'Beginner', desc: 'New to working out' },
  { value: 'intermediate' as const, label: 'Intermediate', desc: '6-12 months of experience' },
  { value: 'advanced' as const, label: 'Advanced', desc: '1+ years of consistent training' },
];

export function Step4Experience({ data, setData }: StepContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Experience Level</h3>
        <p className="text-neutral-600 mb-6">How would you describe your fitness experience?</p>
      </div>

      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setData({ ...data, profile: { ...data.profile, experience_level: level.value } })}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              data.profile.experience_level === level.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-300'
            }`}
          >
            <div className="font-semibold">{level.label}</div>
            <div className="text-sm text-neutral-600">{level.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
