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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles, Check, Loader2, ChefHat } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../design-system';
import { healthEcosystemAPI } from '../../api';
import type { VisionScan } from '../../types';

export function VisionScansList() {
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const { data: scansData, isLoading } = useQuery({
    queryKey: ['vision-scans'],
    queryFn: () => healthEcosystemAPI.getVisionScans({ limit: 10 }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    );
  }

  const pendingScans = scansData?.scans.filter((s) => s.status === 'pending' && s.items.length > 0) || [];

  if (pendingScans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-neutral-500">
          <p>No pending scans. Upload a fridge or grocery photo to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingScans.map((scan) => (
        <VisionScanConfirmation
          key={scan._id}
          scan={scan}
          isExpanded={selectedScanId === scan._id}
          onToggle={() => setSelectedScanId(selectedScanId === scan._id ? null : scan._id)}
        />
      ))}
    </div>
  );
}

interface VisionScanConfirmationProps {
  scan: VisionScan;
  isExpanded: boolean;
  onToggle: () => void;
}

function VisionScanConfirmation({ scan, isExpanded, onToggle }: VisionScanConfirmationProps) {
  const queryClient = useQueryClient();
  const [mealSuggestions, setMealSuggestions] = useState<string[]>([]);

  const analyzeMutation = useMutation({
    mutationFn: () => healthEcosystemAPI.analyzeVisionScan(scan._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-scans'] });
      toast.success('Image analyzed! Review detected items below.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to analyze image');
    },
  });

  const mealSuggestionsMutation = useMutation({
    mutationFn: () => healthEcosystemAPI.generateMealSuggestions(scan._id),
    onSuccess: (data) => {
      setMealSuggestions(data.meal_suggestions);
      toast.success(`Generated ${data.meal_suggestions.length} meal ideas!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate meal suggestions');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      healthEcosystemAPI.updateVisionScan(scan._id, {
        status: 'confirmed',
        items: scan.items.map((item) => ({ ...item, confirmed: true })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-scans'] });
      toast.success('Items confirmed!');
    },
  });

  const sourceLabel = scan.source === 'fridge' ? 'Fridge' : scan.source === 'grocery' ? 'Grocery' : 'Receipt';
  const isAnalyzed = scan.items.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{sourceLabel} Scan</CardTitle>
            <p className="text-xs text-neutral-500 mt-1">
              {new Date(scan.created_at).toLocaleDateString()} • {scan.items.length} items detected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? 'Hide' : 'Review'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {!isAnalyzed && (
            <div className="text-center py-4">
              <Button
                onClick={() => analyzeMutation.mutate()}
                loading={analyzeMutation.isPending}
                disabled={!scan.image_url}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            </div>
          )}

          {isAnalyzed && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-neutral-900">Detected Items</h4>
                <div className="grid gap-2">
                  {scan.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">
                          {item.quantity} {item.unit} • {item.category}
                          {item.freshness_estimate && ` • ${item.freshness_estimate}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            (item.confidence || 0) > 0.8
                              ? 'bg-green-100 text-green-800'
                              : (item.confidence || 0) > 0.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {Math.round((item.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => mealSuggestionsMutation.mutate()}
                  loading={mealSuggestionsMutation.isPending}
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Get Meal Ideas
                </Button>
                <Button className="flex-1" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Items
                </Button>
              </div>

              {mealSuggestions.length > 0 && (
                <div className="space-y-2 border-t border-neutral-200 pt-4">
                  <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    Meal Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {mealSuggestions.map((meal, index) => (
                      <li key={index} className="text-sm text-neutral-700 flex items-center gap-2">
                        <span className="text-primary-600">•</span>
                        {meal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
