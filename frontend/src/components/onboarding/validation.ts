/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import toast from 'react-hot-toast';
import type { OnboardingData } from './types';

export function validateStep(step: number, data: OnboardingData): boolean {
  switch (step) {
    case 0:
      // Profile step - require first name
      if (!data.profile.first_name) {
        toast.error('Please enter your name to continue');
        return false;
      }
      break;

    case 1:
      // Modality step
      if (!data.workout_modality) {
        toast.error('Please select a workout type to continue');
        return false;
      }
      break;

    case 2:
      // Goals step
      if (!data.profile.fitness_goals || data.profile.fitness_goals.length === 0) {
        toast.error('Please select at least one fitness goal');
        return false;
      }
      break;

    case 3:
      // Experience step
      if (!data.profile.experience_level) {
        toast.error('Please select your experience level to continue');
        return false;
      }
      break;

    case 4:
      // Medications step is optional - always pass
      break;

    case 5:
      // Preferences step
      if (!data.preferences.workout_frequency) {
        toast.error('Please select your workout frequency to continue');
        return false;
      }
      if (!data.preferences.preferred_workout_duration) {
        toast.error('Please enter your preferred workout duration to continue');
        return false;
      }
      break;

    case 6:
      // Equipment step is optional - always pass
      break;
  }

  return true;
}
