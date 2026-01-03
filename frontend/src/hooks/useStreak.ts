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

import { useQuery } from '@tanstack/react-query';
import { accountabilityAPI, queryKeys } from '../api';

export function useStreak() {
  const { data } = useQuery({
    queryKey: queryKeys.accountability.status(),
    queryFn: accountabilityAPI.getStatus,
  });

  return {
    currentStreak: data?.streak.current || 0,
    longestStreak: data?.streak.longest || 0,
    freezesAvailable: data?.streak.freezes_available || 2,
    nextMilestone: Math.ceil((data?.streak.current || 0) / 7) * 7 + 7, // Next multiple of 7
  };
}
