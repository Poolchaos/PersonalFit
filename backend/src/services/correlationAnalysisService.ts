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

import MetricsMedicationAnalysis from '../models/MetricsMedicationAnalysis';
import { DoseLog } from '../models/DoseLog';
import { Medication } from '../models/Medication';
import BodyMetrics from '../models/BodyMetrics';
import mongoose from 'mongoose';
import type { IMetricsMedicationAnalysis } from '../models/MetricsMedicationAnalysis';
import type { IDoseLog } from '../models/DoseLog';
import type { IBodyMetrics } from '../models/BodyMetrics';

interface CorrelationResult {
  medication_id: string;
  medication_name: string;
  metric: string;
  correlation_coefficient: number;
  impact_direction: 'positive' | 'negative' | 'neutral';
  confidence_level: 'high' | 'medium' | 'low';
  data_points: number;
  observations: string[];
  sample_period_days: number;
}

interface MedicationMetricData {
  date: Date;
  medicationTaken: boolean;
  metricValue: number;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Calculate average of an array
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Determine confidence level based on data points and correlation strength
 */
export function determineConfidence(
  dataPoints: number,
  correlationCoefficient: number
): 'high' | 'medium' | 'low' {
  const absCorr = Math.abs(correlationCoefficient);

  // High confidence: strong correlation (>0.7) with enough data (>30 points)
  if (dataPoints >= 30 && absCorr >= 0.7) {
    return 'high';
  }

  // Medium confidence: moderate correlation (>0.4) with reasonable data (>15 points)
  if (dataPoints >= 15 && absCorr >= 0.4) {
    return 'medium';
  }

  // Low confidence: everything else
  return 'low';
}

/**
 * Convert confidence level string to numeric value (0-1) for database storage
 */
function confidenceLevelToNumber(level: 'high' | 'medium' | 'low'): number {
  const map = { high: 0.9, medium: 0.6, low: 0.3 };
  return map[level];
}

/**
 * Generate observations based on correlation analysis
 */
function generateObservations(
  medicationName: string,
  metric: string,
  correlation: number,
  avgWithMed: number,
  avgWithoutMed: number,
  dataPoints: number
): string[] {
  const observations: string[] = [];
  const absCorr = Math.abs(correlation);
  const percentChange = avgWithoutMed !== 0
    ? ((avgWithMed - avgWithoutMed) / Math.abs(avgWithoutMed)) * 100
    : 0;

  // Correlation strength observation
  if (absCorr >= 0.7) {
    observations.push(`Strong ${correlation > 0 ? 'positive' : 'negative'} correlation detected`);
  } else if (absCorr >= 0.4) {
    observations.push(`Moderate ${correlation > 0 ? 'positive' : 'negative'} correlation observed`);
  } else if (absCorr >= 0.2) {
    observations.push(`Weak ${correlation > 0 ? 'positive' : 'negative'} correlation detected`);
  } else {
    observations.push(`No significant correlation found`);
  }

  // Impact magnitude observation
  if (Math.abs(percentChange) >= 20) {
    observations.push(
      `${medicationName} associated with ${Math.abs(percentChange).toFixed(1)}% ${
        percentChange > 0 ? 'increase' : 'decrease'
      } in ${metric.replace('_', ' ')}`
    );
  } else if (Math.abs(percentChange) >= 10) {
    observations.push(
      `Slight ${percentChange > 0 ? 'increase' : 'decrease'} in ${metric.replace('_', ' ')} when taking ${medicationName}`
    );
  }

  // Data quality observation
  if (dataPoints < 15) {
    observations.push(`Limited data available - more tracking needed for reliable conclusions`);
  } else if (dataPoints >= 30) {
    observations.push(`Based on ${dataPoints} days of data`);
  }

  // Specific metric insights
  if (correlation < -0.5 && metric === 'sleep_quality') {
    observations.push(`May be impacting sleep negatively - consider taking earlier in the day`);
  }
  if (correlation > 0.5 && metric === 'energy_level') {
    observations.push(`Appears to have positive effect on energy levels`);
  }
  if (Math.abs(correlation) > 0.5 && metric === 'heart_rate') {
    observations.push(`Monitor heart rate changes with healthcare provider`);
  }

  return observations;
}

/**
 * Analyze correlation between a medication and a specific metric
 */
export async function analyzeMedicationMetricCorrelation(
  userId: string,
  medicationId: string,
  metric: string,
  daysBack: number = 90
): Promise<CorrelationResult | null> {
  const medication = await Medication.findById(medicationId);
  if (!medication) {
    throw new Error('Medication not found');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get dose logs for this medication
  const doseLogs = await DoseLog.find({
    user_id: userId,
    medication_id: medicationId,
    taken_at: { $gte: startDate, $exists: true },
    status: 'taken', // Only include doses that were actually taken
  }).sort({ taken_at: 1 });

  // Get metrics data - currently only weight is tracked in BodyMetrics
  // TODO: Implement comprehensive daily metrics tracking for heart_rate, sleep_quality, energy_level, etc.
  if (metric !== 'weight') {
    return null; // Only weight correlation is supported for now
  }

  const bodyMetrics = await BodyMetrics.find({
    user_id: userId,
    measurement_date: { $gte: startDate },
    weight_kg: { $exists: true },
  }).sort({ measurement_date: 1 });

  if (doseLogs.length < 10 || bodyMetrics.length < 10) {
    return null; // Not enough data
  }

  // Build daily data: map each day to whether medication was taken and metric value
  const dailyData = new Map<string, MedicationMetricData>();

  // Process dose logs
  doseLogs.forEach((log: IDoseLog) => {
    if (!log.taken_at) return; // Skip if not taken
    const dateKey = log.taken_at.toISOString().split('T')[0];
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        date: new Date(dateKey),
        medicationTaken: false,
        metricValue: 0,
      });
    }
    dailyData.get(dateKey)!.medicationTaken = true;
  });

  // Process metrics logs
  bodyMetrics.forEach((log: IBodyMetrics) => {
    const dateKey = log.measurement_date.toISOString().split('T')[0];
    const metricValue = log.weight_kg as number | undefined;

    if (metricValue !== undefined && metricValue !== null) {
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: new Date(dateKey),
          medicationTaken: false,
          metricValue,
        });
      } else {
        dailyData.get(dateKey)!.metricValue = metricValue;
      }
    }
  });

  // Filter to only days with both medication data and metric data
  const validData = Array.from(dailyData.values()).filter(
    (d) => d.metricValue > 0
  );

  if (validData.length < 10) {
    return null; // Not enough overlapping data
  }

  // Prepare arrays for correlation calculation
  const medicationBinary = validData.map((d) => (d.medicationTaken ? 1 : 0));
  const metricValues = validData.map((d) => d.metricValue);

  // Calculate correlation
  const correlation = calculatePearsonCorrelation(medicationBinary, metricValues);

  // Calculate averages with and without medication
  const daysWithMed = validData.filter((d) => d.medicationTaken);
  const daysWithoutMed = validData.filter((d) => !d.medicationTaken);

  const avgWithMed = calculateAverage(daysWithMed.map((d) => d.metricValue));
  const avgWithoutMed = calculateAverage(daysWithoutMed.map((d) => d.metricValue));

  // Determine impact direction
  let impactDirection: 'positive' | 'negative' | 'neutral';
  if (Math.abs(correlation) < 0.2) {
    impactDirection = 'neutral';
  } else {
    impactDirection = correlation > 0 ? 'positive' : 'negative';
  }

  // Determine confidence level
  const confidenceLevel = determineConfidence(validData.length, correlation);

  // Generate observations
  const observations = generateObservations(
    medication.name,
    metric,
    correlation,
    avgWithMed,
    avgWithoutMed,
    validData.length
  );

  return {
    medication_id: medicationId,
    medication_name: medication.name,
    metric,
    correlation_coefficient: correlation,
    impact_direction: impactDirection,
    confidence_level: confidenceLevel,
    data_points: validData.length,
    observations,
    sample_period_days: daysBack,
  };
}

/**
 * Analyze all correlations for a user's medications
 */
export async function analyzeAllMedicationCorrelations(
  userId: string,
  daysBack: number = 90
): Promise<CorrelationResult[]> {
  // Get all active medications for user
  const medications = await Medication.find({ user_id: userId, is_active: true });

  const results: CorrelationResult[] = [];

  // Metrics to analyze - currently only weight is supported
  // TODO: Implement comprehensive metrics tracking
  const metricsToAnalyze = ['weight'];

  // Analyze each medication against each metric
  for (const medication of medications) {
    // Only analyze metrics that this medication claims to affect
    const metricsToCheck = medication.affects_metrics?.length
      ? medication.affects_metrics.filter((m: string) => metricsToAnalyze.includes(m))
      : metricsToAnalyze;

    for (const metric of metricsToCheck) {
      try {
        const result = await analyzeMedicationMetricCorrelation(
          userId,
          (medication._id as mongoose.Types.ObjectId).toString(),
          metric,
          daysBack
        );
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error analyzing ${medication.name} vs ${metric}:`, error);
      }
    }
  }

  return results;
}

/**
 * Save correlation analysis results to database
 */
export async function saveCorrelationAnalysis(
  userId: string,
  results: CorrelationResult[]
): Promise<void> {
  const operations = results.map((result) => ({
    updateOne: {
      filter: {
        user_id: userId,
        medication_id: result.medication_id,
        metric: result.metric,
      },
      update: {
        $set: {
          correlation_coefficient: result.correlation_coefficient,
          impact_direction: result.impact_direction,
          confidence_level: confidenceLevelToNumber(result.confidence_level),
          data_points: result.data_points,
          observations: result.observations,
          sample_period_days: result.sample_period_days,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await MetricsMedicationAnalysis.bulkWrite(operations);
  }
}

/**
 * Get correlation insights for a user
 */
export async function getCorrelationInsights(
  userId: string
): Promise<IMetricsMedicationAnalysis[]> {
  return MetricsMedicationAnalysis.find({ user_id: userId })
    .sort({ correlation_coefficient: -1 })
    .limit(50);
}

/**
 * Run correlation analysis for a user (call this periodically)
 */
export async function runCorrelationAnalysis(userId: string): Promise<void> {
  console.log(`Running correlation analysis for user ${userId}...`);

  const results = await analyzeAllMedicationCorrelations(userId);

  if (results.length > 0) {
    await saveCorrelationAnalysis(userId, results);
    console.log(`Saved ${results.length} correlation analyses for user ${userId}`);
  } else {
    console.log(`No correlations found for user ${userId} - need more data`);
  }
}
