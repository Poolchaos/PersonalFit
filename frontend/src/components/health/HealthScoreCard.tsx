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
import { Activity, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../design-system';
import { healthEcosystemAPI, healthEcosystemQueryKeys } from '../../api';

export function HealthScoreCard() {
  const { data, isLoading } = useQuery({
    queryKey: healthEcosystemQueryKeys.healthScores,
    queryFn: () => healthEcosystemAPI.getHealthScores({ limit: 1, skip: 0 }),
  });

  const latest = data?.scores?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          Unified Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-neutral-500">Loading score...</p>}
        {!isLoading && !latest && (
          <div className="text-sm text-neutral-600 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Score will appear after your first check‑ins.
          </div>
        )}
        {latest && (
          <div className="space-y-3">
            <div className="text-3xl font-bold text-neutral-900">{latest.total_score}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
              <div>Fitness: {latest.pillars?.fitness ?? '—'}</div>
              <div>Diet: {latest.pillars?.diet ?? '—'}</div>
              <div>Habits: {latest.pillars?.habits ?? '—'}</div>
              <div>Meds: {latest.pillars?.meds ?? '—'}</div>
              <div>Mental: {latest.pillars?.mental ?? '—'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
