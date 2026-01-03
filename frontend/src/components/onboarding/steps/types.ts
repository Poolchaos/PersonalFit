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

import type { OnboardingData } from '../types';

export interface StepContentProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}

export interface Step0Props extends StepContentProps {
  hasExistingKey: boolean;
  tokenTested: boolean;
  testAIConfigMutation: {
    mutate: () => void;
    isPending: boolean;
  };
}
