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

import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card';
import type { WorkoutPlan } from '../../types';

interface ActiveSessionProps {
  workout: WorkoutPlan;
  onComplete: () => void;
  onCancel: () => void;
}

export function ActiveSession({ onCancel }: ActiveSessionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Session</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-600">
          Please use Start Workout from the dashboard instead.
        </p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-neutral-500 text-white rounded">
          Close
        </button>
      </CardContent>
    </Card>
  );
}