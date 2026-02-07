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
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../design-system';
import { apiClient } from '../../api';

interface CoachingRecommendation {
  priority: 'high' | 'medium' | 'low';
  pillar: 'fitness' | 'diet' | 'habits' | 'meds' | 'mental' | 'cross-pillar';
  title: string;
  message: string;
  action_items: string[];
}

export function AICoachingCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['coaching-recommendations'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ recommendations: CoachingRecommendation[] }>(
        '/api/health-scores/coaching'
      );
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary-600" />;
    }
  };

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'fitness':
        return 'bg-blue-100 text-blue-800';
      case 'diet':
        return 'bg-green-100 text-green-800';
      case 'habits':
        return 'bg-purple-100 text-purple-800';
      case 'meds':
        return 'bg-red-100 text-red-800';
      case 'mental':
        return 'bg-indigo-100 text-indigo-800';
      case 'cross-pillar':
        return 'bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <CardTitle>AI Health Coach</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : data?.recommendations && data.recommendations.length > 0 ? (
          <div className="space-y-4">
            {data.recommendations.map((rec: CoachingRecommendation, index: number) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(rec.priority)}
                    <h4 className="font-semibold text-neutral-900">{rec.title}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPillarColor(rec.pillar)}`}>
                    {rec.pillar === 'cross-pillar' ? 'Holistic' : rec.pillar}
                  </span>
                </div>

                <p className="text-sm text-neutral-700">{rec.message}</p>

                {rec.action_items && rec.action_items.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                      Action Steps
                    </p>
                    <ul className="space-y-1">
                      {rec.action_items.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                          <span className="text-primary-600 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>Keep tracking your health activities to receive personalized coaching!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
