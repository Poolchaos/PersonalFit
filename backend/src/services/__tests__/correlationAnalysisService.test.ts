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

import mongoose from 'mongoose';
import { calculatePearsonCorrelation, calculateAverage, determineConfidence, analyzeMedicationMetricCorrelation, analyzeAllMedicationCorrelations, runCorrelationAnalysis } from '../correlationAnalysisService';
import { DoseLog } from '../../models/DoseLog';
import { Medication } from '../../models/Medication';
import BodyMetrics from '../../models/BodyMetrics';
import MetricsMedicationAnalysis from '../../models/MetricsMedicationAnalysis';

// Connect to test database
beforeAll(async () => {
  // Use MONGODB_URI from environment (loaded by dotenv in jest.config.js)
  const mongoUri = process.env.MONGODB_URI?.replace('/personalfit', '/personalfit-test') || 'mongodb://localhost:27017/personalfit-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Clear test data before each test
beforeEach(async () => {
  await DoseLog.deleteMany({});
  await Medication.deleteMany({});
  await BodyMetrics.deleteMany({});
  await MetricsMedicationAnalysis.deleteMany({});
});

describe('CorrelationAnalysisService', () => {
  const testUserId = new mongoose.Types.ObjectId();

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateAverage([10, 20, 30])).toBe(20);
    });

    it('should handle single value', () => {
      expect(calculateAverage([5])).toBe(5);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('should handle decimals', () => {
      expect(calculateAverage([1.5, 2.5, 3.5])).toBeCloseTo(2.5, 2);
    });
  });

  describe('calculatePearsonCorrelation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(1, 2);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(-1, 2);
    });

    it('should calculate no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 5, 5, 5, 5];
      expect(calculatePearsonCorrelation(x, y)).toBe(0);
    });

    it('should calculate moderate positive correlation', () => {
      const x = [1, 2, 3, 4, 5, 6, 7];
      const y = [2, 3, 4, 6, 5, 8, 9];
      const result = calculatePearsonCorrelation(x, y);
      expect(result).toBeGreaterThan(0.8);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle mismatched lengths', () => {
      const x = [1, 2, 3];
      const y = [1, 2];
      expect(calculatePearsonCorrelation(x, y)).toBe(0);
    });

    it('should handle empty arrays', () => {
      expect(calculatePearsonCorrelation([], [])).toBe(0);
    });

    it('should handle arrays with less than 2 elements', () => {
      expect(calculatePearsonCorrelation([1], [2])).toBe(0);
    });
  });

  describe('determineConfidence', () => {
    it('should return high confidence for strong correlation and many data points', () => {
      expect(determineConfidence(35, 0.85)).toBe('high');
      expect(determineConfidence(50, 0.75)).toBe('high');
    });

    it('should return medium confidence for moderate correlation', () => {
      expect(determineConfidence(20, 0.65)).toBe('medium');
      expect(determineConfidence(25, 0.5)).toBe('medium');
    });

    it('should return low confidence for weak correlation', () => {
      expect(determineConfidence(10, 0.3)).toBe('low');
      expect(determineConfidence(15, 0.35)).toBe('low');
    });

    it('should return low confidence for few data points even with strong correlation', () => {
      expect(determineConfidence(8, 0.9)).toBe('low');
      expect(determineConfidence(12, 0.85)).toBe('low');
    });

    it('should handle edge cases', () => {
      expect(determineConfidence(30, 0.7)).toBe('high'); // Exactly at threshold
      expect(determineConfidence(15, 0.4)).toBe('medium'); // Exactly at threshold
    });
  });

  describe('analyzeMedicationMetricCorrelation', () => {
    it('should return null for non-weight metrics', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Test Med',
        type: 'prescription',
        dosage: { amount: 10, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

      const result = await analyzeMedicationMetricCorrelation(
        testUserId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        'heart_rate',
        90
      );

      expect(result).toBeNull();
    });

    it('should return null when insufficient data points', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Test Med',
        type: 'prescription',
        dosage: { amount: 10, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

      // Create only 5 data points (less than minimum of 10)
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      for (let i = 0; i < 5; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);

        await DoseLog.create({
          user_id: testUserId,
          medication_id: medication._id,
          scheduled_time: new Date(date.setHours(9, 0, 0, 0)),
          taken_at: dateAtMidnight,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: 70 + i * 0.5,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        testUserId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        'weight',
        90
      );

      expect(result).toBeNull();
    });

    it('should calculate correlation for weight metric with sufficient data', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Weight Loss Med',
        type: 'prescription',
        dosage: { amount: 10, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

      // Create 60 data points: medication taken most days, weight decreases with adherence
      // Use recent dates (within last 90 days)
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 60); // Start 60 days ago
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(9, 0, 0, 0);

        const tookMedication = i % 5 !== 4;

        // Clear pattern: weight is lower on days with medication
        const baseWeight = 80;
        let currentWeight;

        if (tookMedication) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: medication._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          // Weight is significantly lower on medication days
          currentWeight = baseWeight - (i * 0.1) - 3; // Downward trend + lower on med days
        } else {
          // Weight is higher on days without medication
          currentWeight = baseWeight - (i * 0.1) + 3; // Same trend but higher on non-med days
        }

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        testUserId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        'weight',
        90
      );

      expect(result).not.toBeNull();
      expect(result?.medication_name).toBe('Weight Loss Med');
      expect(result?.metric).toBe('weight');
      expect(result?.correlation_coefficient).toBeLessThan(0); // Negative correlation (weight decreases)
      expect(result?.impact_direction).toBe('negative');
      expect(result?.data_points).toBe(60);
      expect(result?.confidence_level).toBeDefined();
      expect(result?.observations).toBeInstanceOf(Array);
      expect(result?.observations.length).toBeGreaterThan(0);
    });

    it('should calculate positive correlation for weight gain medication', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Weight Gain Med',
        type: 'supplement',
        dosage: { amount: 500, unit: 'mg', form: 'capsule' },
        frequency: { times_per_day: 2, schedule_times: ['09:00', '21:00'] },
      });

// Create 50 data points: consistent medication use with weight increase
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      for (let i = 0; i < 50; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(9, 0, 0, 0);

        const tookMedication = i % 10 !== 9;

        // Clear pattern: weight is higher on days with medication
        const baseWeight = 65;
        let currentWeight;

        if (tookMedication) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: medication._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          // Weight is significantly higher on medication days
          currentWeight = baseWeight + (i * 0.15) + 4; // Upward trend + higher on med days
        } else {
          // Weight is lower on days without medication
          currentWeight = baseWeight + (i * 0.15) - 3; // Same trend but lower on non-med days
        }

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        testUserId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        'weight',
        90
      );

      expect(result).not.toBeNull();
      expect(result?.correlation_coefficient).toBeGreaterThan(0.5); // Positive correlation
      expect(result?.impact_direction).toBe('positive');
      expect(result?.data_points).toBe(50);
    });
  });

  describe('analyzeAllMedicationCorrelations', () => {
    it('should analyze multiple medications', async () => {
      // Create two medications
      const med1 = await Medication.create({
        user_id: testUserId,
        name: 'Med 1',
        type: 'prescription',
        dosage: { amount: 10, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

      const med2 = await Medication.create({
        user_id: testUserId,
        name: 'Med 2',
        type: 'supplement',
        dosage: { amount: 500, unit: 'mg', form: 'capsule' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

// Create sufficient data for both medications (60 days)
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      let currentWeight = 75;
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(9, 0, 0, 0);

        let weightChange = 0;

        // Med 1 taken most days (32 out of 40)
        if (i % 5 !== 4) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: med1._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          weightChange += 0.15;
        }

        // Med 2 taken on different pattern (24 out of 40)
        if (i % 5 !== 0 && i % 5 !== 1) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: med2._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          weightChange += 0.1;
        }

        // Weight changes based on medications taken
        if (weightChange === 0) weightChange = -0.05; // Slight decrease if no meds
        currentWeight += weightChange;

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      const results = await analyzeAllMedicationCorrelations(testUserId.toString(), 90);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.medication_name === 'Med 1')).toBe(true);
      // Med 2 might not have enough data points depending on implementation
    });

    it('should return empty array when no medications exist', async () => {
      const results = await analyzeAllMedicationCorrelations(testUserId.toString(), 90);
      expect(results).toEqual([]);
    });

    it('should handle medications with insufficient data', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'New Med',
        type: 'prescription',
        dosage: { amount: 5, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['09:00'] },
      });

      // Create only 3 data points
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      for (let i = 0; i < 3; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);

        await DoseLog.create({
          user_id: testUserId,
          medication_id: medication._id,
          scheduled_time: new Date(date.setHours(9, 0, 0, 0)),
          taken_at: dateAtMidnight,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: 70,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      const results = await analyzeAllMedicationCorrelations(testUserId.toString(), 90);
      expect(results).toEqual([]);
    });
  });

  describe('runCorrelationAnalysis', () => {
    it('should save analysis results to database', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Test Medication',
        type: 'prescription',
        dosage: { amount: 20, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['08:00'] },
      });

// Create sufficient data (50 days)
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      let currentWeight = 72;
      for (let i = 0; i < 50; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(8, 0, 0, 0);

        const tookMedication = i % 7 !== 6;

        // Take medication 85% of days (30 out of 35)
        if (tookMedication) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: medication._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          // Weight increases with medication
          currentWeight += 0.2;
        } else {
          // Weight decreases without medication
          currentWeight -= 0.1;
        }

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      await runCorrelationAnalysis(testUserId.toString());

      const savedAnalyses = await MetricsMedicationAnalysis.find({ user_id: testUserId });
      expect(savedAnalyses.length).toBeGreaterThan(0);

      const analysis = savedAnalyses[0];
      expect(analysis.user_id.toString()).toBe(testUserId.toString());
      expect(analysis.medication_id.toString()).toBe((medication._id as mongoose.Types.ObjectId).toString());
      expect(analysis.metric).toBe('weight');
      expect(analysis.correlation_coefficient).toBeDefined();
      expect(analysis.impact_direction).toBeDefined();
      expect(analysis.data_points).toBeGreaterThanOrEqual(10);
      expect(analysis.confidence_level).toBeGreaterThan(0);
      expect(analysis.observations).toBeInstanceOf(Array);
      expect(analysis.created_at).toBeInstanceOf(Date);
    });

    it('should handle users with no medications', async () => {
      await runCorrelationAnalysis(testUserId.toString());
      const savedAnalyses = await MetricsMedicationAnalysis.find({ user_id: testUserId });
      expect(savedAnalyses).toEqual([]);
    });

    it('should update existing analyses', async () => {
      const medication = await Medication.create({
        user_id: testUserId,
        name: 'Update Test Med',
        type: 'prescription',
        dosage: { amount: 15, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1, schedule_times: ['07:00'] },
      });

// Create initial data (50 days)
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - 60);
      let currentWeight = 68;
      for (let i = 0; i < 50; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(7, 0, 0, 0);

        const tookMedication = i % 6 !== 5;

        // Take medication most days (25 out of 30)
        if (tookMedication) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: medication._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          // Weight decreases with medication
          currentWeight -= 0.15;
        } else {
          // Weight increases without medication
          currentWeight += 0.1;
        }

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      // Run analysis first time
      await runCorrelationAnalysis(testUserId.toString());
      const firstAnalysis = await MetricsMedicationAnalysis.findOne({
        user_id: testUserId,
        medication_id: medication._id,
      });
      expect(firstAnalysis).not.toBeNull();

// Add more data (20 additional days = 70 total)
      for (let i = 50; i < 70; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const dateForSchedule = new Date(date);
        dateForSchedule.setHours(7, 0, 0, 0);

        const tookMedication = i % 6 !== 5;

        // Continue medication pattern
        if (tookMedication) {
          await DoseLog.create({
            user_id: testUserId,
            medication_id: medication._id,
            scheduled_time: dateForSchedule,
            taken_at: dateAtMidnight,
            status: 'taken',
          });
          // Weight continues to decrease with medication
          currentWeight -= 0.15;
        } else {
          // Weight increases without medication
          currentWeight += 0.1;
        }

        await BodyMetrics.create({
          user_id: testUserId,
          weight_kg: currentWeight,
          measurement_date: dateAtMidnight,
          recorded_at: date,
        });
      }

      // Run analysis again
      await runCorrelationAnalysis(testUserId.toString());
      const updatedAnalysis = await MetricsMedicationAnalysis.findOne({
        user_id: testUserId,
        medication_id: medication._id,
      });

      expect(updatedAnalysis).not.toBeNull();
      expect(updatedAnalysis!.data_points).toBeGreaterThan(firstAnalysis!.data_points);
      expect(updatedAnalysis!.updated_at.getTime()).toBeGreaterThan(
        firstAnalysis!.created_at.getTime()
      );
    });
  });
});
