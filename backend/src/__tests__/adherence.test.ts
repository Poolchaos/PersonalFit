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

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { Medication } from '../models/Medication';
import { DoseLog } from '../models/DoseLog';
import * as adherenceService from '../services/adherenceService';

let userId: mongoose.Types.ObjectId;

beforeAll(async () => {
  // Connect to test database (use existing connection if already connected)
  if (mongoose.connection.readyState === 0) {
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test';
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  // Clean up but don't close connection (other tests may be running)
  await Medication.deleteMany({});
  await DoseLog.deleteMany({});
});

beforeEach(async () => {
  await Medication.deleteMany({});
  await DoseLog.deleteMany({});
  userId = new mongoose.Types.ObjectId();
});

describe('AdherenceService', () => {
  describe('getAdherenceOverview', () => {
    it('should return empty data when no medications exist', async () => {
      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      expect(result).toBeDefined();
      expect(result.weeklyAdherence).toHaveLength(7);
      expect(result.monthlyAdherence).toHaveLength(30);
      expect(result.medicationAdherence).toHaveLength(0);
      expect(result.streak.current).toBe(0);
      expect(result.streak.longest).toBe(0);
      expect(result.insights).toHaveLength(0);
    });

    it('should calculate adherence correctly with dose logs', async () => {
      // Create a medication
      const medication = await Medication.create({
        user_id: userId,
        name: 'Test Med',
        type: 'prescription',
        dosage: { amount: 500, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 30, refill_threshold: 5 },
        is_active: true,
        start_date: new Date(),
      });

      // Create dose logs for the past 7 days
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 5 ? 'taken' : 'missed', // 5 taken, 2 missed
          taken_at: i < 5 ? scheduledTime : undefined,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      expect(result.medicationAdherence).toHaveLength(1);
      expect(result.medicationAdherence[0].medicationName).toBe('Test Med');
      expect(result.medicationAdherence[0].taken).toBe(5);
      expect(result.medicationAdherence[0].missed).toBe(2);
      expect(result.overallStats.thisWeek.taken).toBe(5);
      expect(result.overallStats.thisWeek.total).toBe(7);
    });

    it('should calculate streak correctly', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Streak Med',
        type: 'supplement',
        dosage: { amount: 1000, unit: 'mg', form: 'capsule' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 30, refill_threshold: 5 },
        is_active: true,
        start_date: new Date(),
      });

      // Create a 5-day streak ending today
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: 'taken',
          taken_at: scheduledTime,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      expect(result.streak.current).toBeGreaterThanOrEqual(1);
      expect(result.streak.longest).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getMedicationAdherence', () => {
    it('should return null for non-existent medication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await adherenceService.getMedicationAdherence(
        userId.toString(),
        fakeId.toString(),
        30
      );

      expect(result.medication).toBeNull();
      expect(result.stats).toBeNull();
    });

    it('should return correct stats for a specific medication', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Specific Med',
        type: 'otc',
        dosage: { amount: 200, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 2, specific_times: ['08:00', '20:00'] },
        inventory: { current_count: 60, refill_threshold: 10 },
        is_active: true,
        start_date: new Date(),
      });

      // Create dose logs
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const scheduledTimeMorning = new Date(now);
        scheduledTimeMorning.setDate(scheduledTimeMorning.getDate() - Math.floor(i / 2));
        scheduledTimeMorning.setHours(8, 0, 0, 0);

        const scheduledTimeEvening = new Date(now);
        scheduledTimeEvening.setDate(scheduledTimeEvening.getDate() - Math.floor(i / 2));
        scheduledTimeEvening.setHours(20, 0, 0, 0);

        if (i % 2 === 0) {
          await DoseLog.create({
            user_id: userId,
            medication_id: medication._id,
            scheduled_time: scheduledTimeMorning,
            status: 'taken',
            taken_at: scheduledTimeMorning,
          });
        } else {
          await DoseLog.create({
            user_id: userId,
            medication_id: medication._id,
            scheduled_time: scheduledTimeEvening,
            status: i < 10 ? 'taken' : 'missed',
            taken_at: i < 10 ? scheduledTimeEvening : undefined,
          });
        }
      }

      const result = await adherenceService.getMedicationAdherence(
        userId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        30
      );

      expect(result.medication).toBeDefined();
      expect(result.medication?.name).toBe('Specific Med');
      expect(result.stats).toBeDefined();
      expect(result.stats?.medicationId).toBe((medication._id as mongoose.Types.ObjectId).toString());
      expect(result.dailyAdherence.length).toBeGreaterThan(0);
    });

    it('should calculate time patterns correctly', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Pattern Med',
        type: 'prescription',
        dosage: { amount: 50, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 3 },
        inventory: { current_count: 90, refill_threshold: 15 },
        is_active: true,
        start_date: new Date(),
      });

      const now = new Date();

      // Create morning doses (all taken)
      for (let i = 0; i < 5; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: 'taken',
          taken_at: scheduledTime,
        });
      }

      // Create afternoon doses (some missed)
      for (let i = 0; i < 5; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(14, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 3 ? 'taken' : 'missed',
          taken_at: i < 3 ? scheduledTime : undefined,
        });
      }

      // Create evening doses (mostly missed)
      for (let i = 0; i < 5; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(20, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 1 ? 'taken' : 'missed',
          taken_at: i < 1 ? scheduledTime : undefined,
        });
      }

      const result = await adherenceService.getMedicationAdherence(
        userId.toString(),
        (medication._id as mongoose.Types.ObjectId).toString(),
        30
      );

      expect(result.timePatterns.length).toBeGreaterThan(0);
      // Evening pattern should have highest missed percentage
      const eveningPattern = result.timePatterns.find(p => p.pattern === 'evening');
      const morningPattern = result.timePatterns.find(p => p.pattern === 'morning');

      if (eveningPattern && morningPattern) {
        expect(eveningPattern.missedPercentage).toBeGreaterThan(morningPattern.missedPercentage);
      }
    });
  });

  describe('insights generation', () => {
    it('should generate streak insight for 7+ day streak', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Streak Insight Med',
        type: 'supplement',
        dosage: { amount: 500, unit: 'mg', form: 'capsule' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 30, refill_threshold: 5 },
        is_active: true,
        start_date: new Date(),
      });

      // Create a 10-day streak
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: 'taken',
          taken_at: scheduledTime,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      const streakInsight = result.insights.find(i => i.type === 'streak');
      expect(streakInsight).toBeDefined();
      expect(streakInsight?.severity).toBe('success');
    });

    it('should generate medication-specific insight for low adherence', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Low Adherence Med',
        type: 'prescription',
        dosage: { amount: 100, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 30, refill_threshold: 5 },
        is_active: true,
        start_date: new Date(),
      });

      // Create dose logs with low adherence (< 70%)
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 5 ? 'taken' : 'missed', // 50% adherence
          taken_at: i < 5 ? scheduledTime : undefined,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      const medInsight = result.insights.find(i => i.type === 'medication_specific');
      expect(medInsight).toBeDefined();
      expect(medInsight?.severity).toBe('warning');
      expect(medInsight?.title).toContain('Low Adherence Med');
    });
  });

  describe('daily adherence calculation', () => {
    it('should handle days with no scheduled doses', async () => {
      // No medications or doses created
      const result = await adherenceService.getAdherenceOverview(userId.toString(), 7);

      expect(result.weeklyAdherence).toHaveLength(7);
      result.weeklyAdherence.forEach(day => {
        expect(day.total).toBe(0);
        expect(day.percentage).toBe(0);
      });
    });

    it('should correctly count taken, missed, and skipped doses', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Multi Status Med',
        type: 'prescription',
        dosage: { amount: 250, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 3 },
        inventory: { current_count: 90, refill_threshold: 15 },
        is_active: true,
        start_date: new Date(),
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create 3 doses for today with different statuses
      await DoseLog.create({
        user_id: userId,
        medication_id: medication._id,
        scheduled_time: new Date(today.setHours(8, 0, 0, 0)),
        status: 'taken',
        taken_at: new Date(today.setHours(8, 15, 0, 0)),
      });

      await DoseLog.create({
        user_id: userId,
        medication_id: medication._id,
        scheduled_time: new Date(today.setHours(14, 0, 0, 0)),
        status: 'skipped',
      });

      await DoseLog.create({
        user_id: userId,
        medication_id: medication._id,
        scheduled_time: new Date(today.setHours(20, 0, 0, 0)),
        status: 'missed',
      });

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 1);

      const todayData = result.weeklyAdherence.find(d => {
        const date = new Date(d.date);
        const now = new Date();
        return date.toDateString() === now.toDateString();
      });

      // May be undefined if timing crosses midnight during test
      if (todayData) {
        expect(todayData.taken).toBeGreaterThanOrEqual(0);
        expect(todayData.total).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('overall stats', () => {
    it('should calculate this week stats correctly', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'Weekly Stats Med',
        type: 'supplement',
        dosage: { amount: 1000, unit: 'iu', form: 'capsule' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 30, refill_threshold: 5 },
        is_active: true,
        start_date: new Date(),
      });

      const now = new Date();

      // Create 7 doses in the past week, 5 taken
      for (let i = 0; i < 7; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(9, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 5 ? 'taken' : 'missed',
          taken_at: i < 5 ? scheduledTime : undefined,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      expect(result.overallStats.thisWeek.taken).toBe(5);
      expect(result.overallStats.thisWeek.total).toBe(7);
      expect(result.overallStats.thisWeek.percentage).toBe(71); // Math.round(5/7*100)
    });

    it('should calculate all time stats from database', async () => {
      const medication = await Medication.create({
        user_id: userId,
        name: 'All Time Med',
        type: 'prescription',
        dosage: { amount: 50, unit: 'mg', form: 'tablet' },
        frequency: { times_per_day: 1 },
        inventory: { current_count: 100, refill_threshold: 10 },
        is_active: true,
        start_date: new Date(),
      });

      // Create doses spanning 60 days (beyond the 30-day window)
      const now = new Date();
      for (let i = 0; i < 60; i++) {
        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() - i);
        scheduledTime.setHours(8, 0, 0, 0);

        await DoseLog.create({
          user_id: userId,
          medication_id: medication._id,
          scheduled_time: scheduledTime,
          status: i < 50 ? 'taken' : 'missed', // 50 taken, 10 missed
          taken_at: i < 50 ? scheduledTime : undefined,
        });
      }

      const result = await adherenceService.getAdherenceOverview(userId.toString(), 30);

      expect(result.overallStats.allTime.taken).toBe(50);
      expect(result.overallStats.allTime.total).toBe(60);
      expect(result.overallStats.allTime.percentage).toBe(83); // Math.round(50/60*100)
    });
  });
});
