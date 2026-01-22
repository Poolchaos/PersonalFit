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
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button } from '../design-system';
import { medicationAPI, medicationQueryKeys } from '../api';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';

interface CorrelationData {
  _id: string;
  medication_id: string;
  medication_name: string;
  metric: string;
  correlation_coefficient: number;
  impact_direction: 'positive' | 'negative' | 'neutral';
  confidence_level: 'high' | 'medium' | 'low';
  data_points: number;
  observations: string[];
  sample_period_days: number;
  analyzed_at: string;
}

const METRIC_LABELS: Record<string, string> = {
  heart_rate: '❤️ Heart Rate',
  blood_pressure: '🩸 Blood Pressure',
  sleep_quality: '😴 Sleep Quality',
  energy_level: '⚡ Energy Level',
  strength: '💪 Strength',
  endurance: '🏃 Endurance',
  recovery: '🔄 Recovery',
  weight: '⚖️ Weight',
  mood: '😊 Mood',
};

const getImpactColor = (direction: string, confidenceLevel: string) => {
  if (confidenceLevel === 'low') return 'text-gray-500';
  if (direction === 'positive') return 'text-green-600';
  if (direction === 'negative') return 'text-red-600';
  return 'text-gray-500';
};

const getImpactIcon = (direction: string) => {
  if (direction === 'positive') return <TrendingUp className="w-5 h-5" />;
  if (direction === 'negative') return <TrendingDown className="w-5 h-5" />;
  return <Minus className="w-5 h-5" />;
};

const getConfidenceBadge = (level: string) => {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-600',
  };
  return colors[level as keyof typeof colors] || colors.low;
};

export default function CorrelationInsightsPage() {
  const queryClient = useQueryClient();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Fetch correlations
  const { data: correlationsData, isLoading } = useQuery({
    queryKey: medicationQueryKeys.correlations(),
    queryFn: medicationAPI.getCorrelations,
  });

  // Trigger analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: medicationAPI.triggerAnalysis,
    onSuccess: () => {
      toast.success('Correlation analysis started. Refresh in a minute to see results.');
      // Refetch after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: medicationQueryKeys.correlations() });
      }, 60000); // 1 minute
    },
    onError: () => {
      toast.error('Failed to start correlation analysis');
    },
  });

  const correlations = correlationsData?.data || [];

  // Group correlations by medication
  const groupedByMedication = correlations.reduce(
    (acc: Record<string, CorrelationData[]>, item: CorrelationData) => {
      if (!acc[item.medication_name]) {
        acc[item.medication_name] = [];
      }
      acc[item.medication_name].push(item);
      return acc;
    },
    {} as Record<string, CorrelationData[]>
  );

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-6 h-6 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Health Correlations</h1>
              </div>
              <p className="text-gray-600">
                AI-powered insights on how your medications and supplements affect your health metrics
              </p>
            </div>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
              {analyzeMutation.isPending ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>

          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How This Works</p>
              <p>
                We analyze your workout metrics, sleep logs, and medication adherence to identify
                correlations. The confidence level indicates the statistical strength of each correlation.
              </p>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8 text-center">
              <div className="animate-pulse">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Loading correlation data...</p>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && correlations.length === 0 && (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No correlation data yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Track your medications and health metrics consistently for at least 2 weeks to see correlations
              </p>
              <Button onClick={() => analyzeMutation.mutate()}>
                Run Analysis Now
              </Button>
            </Card>
          )}

          {/* Correlations by Medication */}
          {!isLoading && correlations.length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedByMedication).map(([medName, medicationCorrelations]) => (
                <Card key={medName} className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">{medName}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(medicationCorrelations as CorrelationData[]).map((item: CorrelationData) => (
                      <div
                        key={item._id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedMetric(item.metric)}
                      >
                        {/* Metric Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {METRIC_LABELS[item.metric] || item.metric}
                          </div>
                          <div className={`${getImpactColor(item.impact_direction, item.confidence_level)}`}>
                            {getImpactIcon(item.impact_direction)}
                          </div>
                        </div>

                        {/* Correlation Score */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Correlation</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {Math.abs(item.correlation_coefficient).toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                item.impact_direction === 'positive'
                                  ? 'bg-green-500'
                                  : item.impact_direction === 'negative'
                                  ? 'bg-red-500'
                                  : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.abs(item.correlation_coefficient) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Confidence & Data Points */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceBadge(
                              item.confidence_level
                            )}`}
                          >
                            {item.confidence_level} confidence
                          </span>
                          <span className="text-xs text-gray-600">{item.data_points} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Detailed View */}
          {selectedMetric && (
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Analysis: {METRIC_LABELS[selectedMetric] || selectedMetric}
              </h3>

              <div className="space-y-4">
                {correlations
                  .filter((item) => item.metric === selectedMetric)
                  .map((item) => (
                    <div key={item._id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{item.medication_name}</h4>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Impact</p>
                          <p
                            className={`text-sm font-semibold ${getImpactColor(
                              item.impact_direction,
                              item.confidence_level
                            )}`}
                          >
                            {item.impact_direction === 'positive'
                              ? '↑ Positive'
                              : item.impact_direction === 'negative'
                              ? '↓ Negative'
                              : '→ Neutral'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Confidence</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceBadge(
                              item.confidence_level
                            )}`}
                          >
                            {item.confidence_level}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Data Points</p>
                          <p className="text-sm font-semibold text-gray-900">{item.data_points}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900">Key Observations:</p>
                        <ul className="space-y-1">
                          {item.observations.map((obs: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-blue-600">•</span>
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setSelectedMetric(null)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Close Detail View
              </button>
            </Card>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}

