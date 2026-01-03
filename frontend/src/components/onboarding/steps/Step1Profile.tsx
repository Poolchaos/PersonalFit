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
import { Input } from '../../../design-system';
import type { StepContentProps } from './types';

export function Step1Profile({ data, setData }: StepContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Let's get to know you</h3>
        <p className="text-neutral-600 mb-6">Tell us a bit about yourself to personalize your fitness journey.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="John"
          value={data.profile.first_name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, first_name: e.target.value } })}
        />
        <Input
          label="Last Name"
          placeholder="Doe"
          value={data.profile.last_name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, last_name: e.target.value } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Height (cm)"
          type="number"
          placeholder="175"
          value={data.profile.height_cm || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, height_cm: Number(e.target.value) } })}
        />
        <Input
          label="Weight (kg)"
          type="number"
          placeholder="70"
          value={data.profile.weight_kg || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, weight_kg: Number(e.target.value) } })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Current Regular Activities
          <span className="text-neutral-500 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
          placeholder="e.g., Daily 30min uphill walk with dog, 3x weekly yoga classes, cycle to work 5km each way"
          value={data.profile.current_activities || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, profile: { ...data.profile, current_activities: e.target.value } })}
        />
        <p className="text-xs text-neutral-500 flex items-start gap-2">
          <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tell us about physical activities you already do regularly. This helps us create a workout plan that complements your lifestyle without overtraining.</span>
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Injuries, Impairments & Exercise Restrictions
          <span className="text-neutral-500 font-normal ml-1">(optional but important)</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px] resize-y"
          placeholder="e.g., Injured left knee - no squats or lunges; Pilonidal sinus - cannot do situps or exercises with direct pressure on lower back; Previous shoulder surgery - limited overhead movements"
          value={data.profile.injuries_and_restrictions || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, profile: { ...data.profile, injuries_and_restrictions: e.target.value } })}
        />
        <p className="text-xs text-red-600 flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Important for your safety: Please list any injuries, medical conditions, or physical limitations. This ensures your workout plan avoids exercises that could cause harm or aggravate existing conditions.</span>
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-xs text-blue-800">
            <strong>Examples:</strong> Knee injuries, back problems, shoulder impairments, missing limbs, pilonidal sinus, hernias, recent surgeries, balance issues, joint problems, chronic pain conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
