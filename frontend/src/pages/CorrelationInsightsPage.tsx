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
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity } from 'lucide-react';
import { Card } from '../design-system';

interface CorrelationData {
  medication_name: string;
  metric: string;
  correlation: number;
  impact_direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  data_points: number;
  observations: string[];
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

const getImpactColor = (direction: string, confidence: number) => {
  if (confidence < 0.3) return 'text-gray-500';
  if (direction === 'positive') return 'text-green-600';
  if (direction === 'negative') return 'text-red-600';
  return 'text-gray-500';
};

const getImpactIcon = (direction: string) => {
  if (direction === 'positive') return <TrendingUp className="w-5 h-5" />;
  if (direction === 'negative') return <TrendingDown className="w-5 h-5" />;
  return <Minus className="w-5 h-5" />;
};

const CorrelationInsights = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [mockData] = useState<CorrelationData[]>([
    {
      medication_name: 'Vitamin D3',
      metric: 'mood',
      correlation: 0.72,
      impact_direction: 'positive',
      confidence: 0.85,
      data_points: 45,
      observations: [
        'Mood improved 34% on days medication was taken',
        'Most consistent impact on Friday-Sunday',
        'Winter months show stronger correlation',
      ],
    },
    {
      medication_name: 'Caffeine Supplement',
      metric: 'energy_level',
      correlation: 0.68,
      impact_direction: 'positive',
      confidence: 0.79,
      data_points: 38,
      observations: [
        'Energy boost within 30-60 minutes',
        'Effect duration approximately 4-6 hours',
        'Less effective after 2pm dosing',
      ],
    },
    {
      medication_name: 'Melatonin',
      metric: 'sleep_quality',
      correlation: 0.81,
      impact_direction: 'positive',
      confidence: 0.92,
      data_points: 52,
      observations: [
        'Sleep quality improved by 42%',
        'Most effective 1-2 hours before bed',
        'Consistent effect across all weeks',
      ],
    },
    {
      medication_name: 'Beta Blocker',
      metric: 'heart_rate',
      correlation: -0.65,
      impact_direction: 'negative',
      confidence: 0.88,
      data_points: 41,
      observations: [
        'Resting heart rate reduced by 18 bpm',
        'No negative impact on workout performance',
        'Consistent dosing shows steady results',
      ],
    },
  ]);

  const groupedByMedication = mockData.reduce(
    (acc, item) => {
      if (!acc[item.medication_name]) {
        acc[item.medication_name] = [];
      }
      acc[item.medication_name].push(item);
      return acc;
    },
    {} as Record<string, CorrelationData[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Health Correlations</h1>
        </div>
        <p className="text-gray-600">
          AI-powered insights on how your medications and supplements affect your health metrics
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How This Works</p>
          <p>
            We analyze your workout metrics, sleep logs, and medication adherence to identify
            correlations. The confidence score indicates the statistical strength of each correlation.
          </p>
        </div>
      </Card>

      {/* Correlations by Medication */}
      <div className="space-y-4">
        {Object.entries(groupedByMedication).map(([medName, correlations]) => (
          <Card key={medName} className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">{medName}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {correlations.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMetric(item.metric)}
                >
                  {/* Metric Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {METRIC_LABELS[item.metric]}
                    </div>
                    <div className={`${getImpactColor(item.impact_direction, item.confidence)}`}>
                      {getImpactIcon(item.impact_direction)}
                    </div>
                  </div>

                  {/* Correlation Score */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Correlation</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.abs(item.correlation).toFixed(2)}
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
                        style={{ width: `${Math.abs(item.correlation) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence & Data Points */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {(item.confidence * 100).toFixed(0)}% confident • {item.data_points} data points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedMetric && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Analysis: {selectedMetric}
          </h3>

          <div className="space-y-4">
            {mockData
              .filter((item) => item.metric === selectedMetric)
              .map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.medication_name}</h4>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Impact</p>
                      <p
                        className={`text-sm font-semibold ${getImpactColor(
                          item.impact_direction,
                          item.confidence
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
                      <p className="text-sm font-semibold text-gray-900">
                        {(item.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Data Points</p>
                      <p className="text-sm font-semibold text-gray-900">{item.data_points}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Key Observations:</p>
                    <ul className="space-y-1">
                      {item.observations.map((obs, i) => (
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

      {/* Empty State */}
      {Object.keys(groupedByMedication).length === 0 && (
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No correlation data yet</p>
          <p className="text-sm text-gray-500">
            Track your medications and health metrics consistently to see correlations appear here
          </p>
        </Card>
      )}
    </div>
  );
};

export default CorrelationInsights;
