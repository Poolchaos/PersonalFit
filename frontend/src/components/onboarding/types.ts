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

import type { UserProfile } from '../../types';

export interface OnboardingData {
  openai_token?: string;
  workout_modality?: 'strength' | 'cardio' | 'hybrid';
  profile: Partial<UserProfile>;
  equipment: string[];
  preferences: {
    preferred_workout_duration?: number;
    workout_frequency?: number;
  };
}

export interface StepContentProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  tokenTested?: boolean;
  testAIConfigMutation?: {
    mutate: () => void;
    isPending: boolean;
  };
}
