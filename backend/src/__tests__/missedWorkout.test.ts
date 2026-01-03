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
import WorkoutSession from '../models/WorkoutSession';
import WorkoutPlan from '../models/WorkoutPlan';
import Accountability from '../models/Accountability';
import {
  findMissedWorkouts,
  processMissedWorkouts,
} from '../services/missedWorkoutService';

describe('Missed Workout Detection', () => {
  let token: string;
  let userId: string;
  let planId: string;

  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await WorkoutSession.deleteMany({});
    await WorkoutPlan.deleteMany({});
    await Accountability.deleteMany({});

    // Create test user
    const signupRes = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: 'Test@1234',
    });

    token = signupRes.body.accessToken;
    userId = signupRes.body.user.id;

    // Create test workout plan
    const plan = await WorkoutPlan.create({
      user_id: userId,
      workout_modality: 'strength',
      plan_data: {
        plan_overview: {
          duration_weeks: 4,
          sessions_per_week: 3,
          focus_areas: ['chest', 'back'],
          equipment_required: ['dumbbells'],
        },
        weekly_schedule: [],
        progression_notes: 'Test progression',
        safety_reminders: [],
      },
      generation_context: {
        experience_level: 'intermediate',
        equipment_used: ['dumbbells'],
        workout_modality: 'strength',
      },
      is_active: true,
    });
    planId = (plan._id as mongoose.Types.ObjectId).toString();
  });

  describe('findMissedWorkouts', () => {
    it('should find workouts that are more than 24 hours overdue', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(1);
      expect(missed[0].userId.toString()).toBe(userId);
      expect(missed[0].hoursOverdue).toBeGreaterThanOrEqual(48);
    });

    it('should not find workouts less than 24 hours old', async () => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twelveHoursAgo,
        completion_status: 'planned',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(0);
    });

    it('should not find completed workouts', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'completed',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(0);
    });

    it('should not find skipped workouts', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'skipped',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(0);
    });

    it('should find in_progress workouts that are overdue', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'in_progress',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(1);
    });

    it('should include difficulty from workout plan', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const missed = await findMissedWorkouts();

      expect(missed[0].difficulty).toBe('intermediate');
    });

    it('should handle sessions without a plan', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const missed = await findMissedWorkouts();

      expect(missed).toHaveLength(1);
      expect(missed[0].difficulty).toBeUndefined();
    });
  });

  describe('processMissedWorkouts', () => {
    it('should mark overdue sessions as skipped', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const session = await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      await processMissedWorkouts();

      const updatedSession = await WorkoutSession.findById(session._id);
      expect(updatedSession?.completion_status).toBe('skipped');
      expect(updatedSession?.notes).toContain('Automatically marked as skipped');
    });

    it('should assign penalties for missed workouts', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const result = await processMissedWorkouts();

      expect(result.penaltiesAssigned).toBe(1);

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.penalties).toHaveLength(1);
      expect(accountability?.penalties[0].penalty_type).toBe('missed_workout');
    });

    it('should reset streaks for missed workouts', async () => {
      // First create a streak
      await Accountability.create({
        user_id: userId,
        streak: {
          current_streak: 5,
          longest_streak: 5,
        },
        penalties: [],
        weekly_stats: [],
        total_workouts_completed: 5,
        total_workouts_missed: 0,
        total_penalties: 0,
      });

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const result = await processMissedWorkouts();

      expect(result.streaksReset).toBe(1);

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.streak.current_streak).toBe(0);
      expect(accountability?.total_workouts_missed).toBe(1);
    });

    it('should assign light penalty for 1-day overdue beginner workout', async () => {
      // Update plan to beginner
      await WorkoutPlan.findByIdAndUpdate(planId, {
        'generation_context.experience_level': 'beginner',
      });

      const oneDayAgo = new Date(Date.now() - 26 * 60 * 60 * 1000); // 26 hours

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: oneDayAgo,
        completion_status: 'planned',
      });

      await processMissedWorkouts();

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.penalties[0].severity).toBe('light');
    });

    it('should assign moderate penalty for 2-day overdue intermediate workout', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      await processMissedWorkouts();

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.penalties[0].severity).toBe('moderate');
    });

    it('should assign severe penalty for 3+ day overdue advanced workout', async () => {
      // Update plan to advanced
      await WorkoutPlan.findByIdAndUpdate(planId, {
        'generation_context.experience_level': 'advanced',
      });

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: threeDaysAgo,
        completion_status: 'planned',
      });

      await processMissedWorkouts();

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.penalties[0].severity).toBe('severe');
    });

    it('should process multiple missed workouts', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create([
        {
          user_id: userId,
          plan_id: planId,
          session_date: twoDaysAgo,
          completion_status: 'planned',
        },
        {
          user_id: userId,
          plan_id: planId,
          session_date: threeDaysAgo,
          completion_status: 'planned',
        },
      ]);

      const result = await processMissedWorkouts();

      expect(result.processed).toBe(2);
      expect(result.penaltiesAssigned).toBe(2);

      const accountability = await Accountability.findOne({ user_id: userId });
      expect(accountability?.penalties).toHaveLength(2);
    });

    it('should return correct statistics', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const result = await processMissedWorkouts();

      expect(result).toEqual({
        processed: 1,
        penaltiesAssigned: 1,
        streaksReset: 1,
      });
    });
  });

  describe('POST /api/admin/trigger-missed-workout-detection', () => {
    it('should manually trigger detection', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await WorkoutSession.create({
        user_id: userId,
        plan_id: planId,
        session_date: twoDaysAgo,
        completion_status: 'planned',
      });

      const res = await request(app)
        .post('/api/admin/trigger-missed-workout-detection')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('processed');
      expect(res.body).toHaveProperty('penaltiesAssigned');
      expect(res.body).toHaveProperty('streaksReset');
      expect(res.body.processed).toBe(1);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/admin/trigger-missed-workout-detection');

      expect(res.status).toBe(401);
    });
  });
});
