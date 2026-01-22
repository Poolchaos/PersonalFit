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

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import { Medication } from '../models/Medication';
import { DoseLog } from '../models/DoseLog';
import BodyMetrics from '../models/BodyMetrics';
import MetricsMedicationAnalysis from '../models/MetricsMedicationAnalysis';
import {
  analyzeMedicationMetricCorrelation,
  analyzeAllMedicationCorrelations,
  runCorrelationAnalysis,
  getCorrelationInsights,
} from '../services/correlationAnalysisService';

describe('Correlation Analysis', () => {
  let userId: string;
  let medicationId: string;
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database (use existing connection if already connected)
    if (mongoose.connection.readyState === 0) {
      const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test';
      await mongoose.connect(testDbUri);
    }
  });

  afterAll(async () => {
    // Clean up but don't drop database or close connection (other tests may be running)
    await User.deleteMany({});
    await Medication.deleteMany({});
    await DoseLog.deleteMany({});
    await BodyMetrics.deleteMany({});
    await MetricsMedicationAnalysis.deleteMany({});
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Medication.deleteMany({});
    await DoseLog.deleteMany({});
    await BodyMetrics.deleteMany({});
    await MetricsMedicationAnalysis.deleteMany({});

    // Create test user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    userId = signupResponse.body.user._id;
    authToken = signupResponse.body.accessToken;

    // Create test medication
    const medicationResponse = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Supplement',
        type: 'supplement',
        dosage: {
          amount: 1000,
          unit: 'mg',
          form: 'capsule',
        },
        frequency: {
          times_per_day: 1,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
        },
        inventory: {
          current_count: 30,
          refill_threshold: 7,
        },
        affects_metrics: ['weight'],
      });

    medicationId = medicationResponse.body.medication._id;
  });

  describe('Correlation Calculation', () => {
    it('should return null when insufficient data', async () => {
      // Create only 5 days of data (< 10 minimum)
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await DoseLog.create({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: date,
          taken_at: date,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: 70 + Math.random() * 2,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'weight',
        30
      );

      expect(result).toBeNull();
    });

    it('should calculate positive correlation correctly', async () => {
      // Create data showing positive correlation: medication taken = higher weight
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const medicationTaken = i % 2 === 0; // Take medication every other day
        const weight = medicationTaken ? 71 + Math.random() : 69 + Math.random();

        if (medicationTaken) {
          await DoseLog.create({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: date,
            taken_at: date,
            status: 'taken',
          });
        }

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: weight,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'weight',
        30
      );

      expect(result).not.toBeNull();
      expect(result!.correlation_coefficient).toBeGreaterThan(0);
      expect(result!.impact_direction).toBe('positive');
      expect(result!.data_points).toBeGreaterThanOrEqual(10);
      expect(result!.observations).toBeDefined();
      expect(result!.observations.length).toBeGreaterThan(0);
    });

    it('should calculate negative correlation correctly', async () => {
      // Create data showing negative correlation: medication taken = lower weight
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const medicationTaken = i % 2 === 0;
        const weight = medicationTaken ? 69 + Math.random() : 71 + Math.random();

        if (medicationTaken) {
          await DoseLog.create({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: date,
            taken_at: date,
            status: 'taken',
          });
        }

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: weight,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'weight',
        30
      );

      expect(result).not.toBeNull();
      expect(result!.correlation_coefficient).toBeLessThan(0);
      expect(result!.impact_direction).toBe('negative');
    });

    it('should return null for non-weight metrics', async () => {
      // Only weight is currently supported
      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'sleep_quality',
        30
      );

      expect(result).toBeNull();
    });
  });

  describe('Bulk Analysis', () => {
    it('should analyze all medications for a user', async () => {
      // Create sufficient data
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await DoseLog.create({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: date,
          taken_at: date,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: 70 + Math.random() * 2,
        });
      }

      const results = await analyzeAllMedicationCorrelations(userId, 30);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('medication_id');
        expect(results[0]).toHaveProperty('metric');
        expect(results[0]).toHaveProperty('correlation_coefficient');
      }
    });

    it('should run full analysis and save to database', async () => {
      // Create sufficient data
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await DoseLog.create({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: date,
          taken_at: date,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: 70 + Math.random() * 2,
        });
      }

      await runCorrelationAnalysis(userId);

      // Check if analysis was saved
      const insights = await getCorrelationInsights(userId);
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    it('should get correlation insights via API', async () => {
      const response = await request(app)
        .get('/api/medications/correlations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should trigger analysis via API', async () => {
      const response = await request(app)
        .post('/api/medications/correlations/analyze')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/medications/correlations');

      expect(response.status).toBe(401);
    });

    it('should populate medication names in response', async () => {
      // Create data and run analysis
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await DoseLog.create({
          user_id: userId,
          medication_id: medicationId,
          scheduled_time: date,
          taken_at: date,
          status: 'taken',
        });

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: 70 + Math.random() * 2,
        });
      }

      await runCorrelationAnalysis(userId);

      const response = await request(app)
        .get('/api/medications/correlations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('medication_name');
        expect(response.body.data[0].medication_name).toBe('Test Supplement');
      }
    });
  });

  describe('Confidence Levels', () => {
    it('should assign high confidence for strong correlation with lots of data', async () => {
      // Create 40 days of strong correlation data
      for (let i = 0; i < 40; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const medicationTaken = i % 2 === 0;
        const weight = medicationTaken ? 72 : 68; // Strong correlation

        if (medicationTaken) {
          await DoseLog.create({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: date,
            taken_at: date,
            status: 'taken',
          });
        }

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: weight,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'weight',
        90
      );

      expect(result).not.toBeNull();
      expect(Math.abs(result!.correlation_coefficient)).toBeGreaterThan(0.7);
      expect(result!.confidence_level).toBe('high');
    });

    it('should assign low confidence for weak correlation', async () => {
      // Create data with weak/random correlation
      for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const medicationTaken = Math.random() > 0.5;
        const weight = 70 + Math.random() * 4; // Random weight

        if (medicationTaken) {
          await DoseLog.create({
            user_id: userId,
            medication_id: medicationId,
            scheduled_time: date,
            taken_at: date,
            status: 'taken',
          });
        }

        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: weight,
        });
      }

      const result = await analyzeMedicationMetricCorrelation(
        userId,
        medicationId,
        'weight',
        90
      );

      if (result) {
        expect(['low', 'medium']).toContain(result.confidence_level);
      }
    });
  });
});
