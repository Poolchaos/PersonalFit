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
import Accountability from '../models/Accountability';
import WorkoutSession from '../models/WorkoutSession';

describe('Accountability API', () => {
  let token: string;
  let userId: string;

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
    await Accountability.deleteMany({});
    await WorkoutSession.deleteMany({});

    // Create test user and login
    const signupRes = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: 'Test@1234',
    });

    token = signupRes.body.accessToken;
    userId = signupRes.body.user.id;
  });

  describe('GET /api/accountability', () => {
    it('should get accountability summary for new user', async () => {
      const res = await request(app)
        .get('/api/accountability')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('streak');
      expect(res.body).toHaveProperty('totals');
      expect(res.body).toHaveProperty('current_week');
      expect(res.body.streak.current).toBe(0);
      expect(res.body.totals.workouts_completed).toBe(0);
    });

    it('should get accountability summary with existing data', async () => {
      // Create accountability record
      await Accountability.create({
        user_id: new mongoose.Types.ObjectId(userId),
        streak: {
          current_streak: 5,
          longest_streak: 7,
          last_workout_date: new Date(),
        },
        penalties: [],
        weekly_stats: [],
        total_workouts_completed: 10,
        total_workouts_missed: 2,
        total_penalties: 2,
      });

      const res = await request(app)
        .get('/api/accountability')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.streak.current).toBe(5);
      expect(res.body.streak.longest).toBe(7);
      expect(res.body.totals.workouts_completed).toBe(10);
      expect(res.body.totals.workouts_missed).toBe(2);
    });
  });

  describe('GET /api/accountability/details', () => {
    it('should get full accountability details', async () => {
      const res = await request(app)
        .get('/api/accountability/details')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('streak');
      expect(res.body).toHaveProperty('penalties');
      expect(res.body).toHaveProperty('weekly_stats');
    });
  });

  describe('POST /api/accountability/penalties', () => {
    it('should create a new penalty', async () => {
      const res = await request(app)
        .post('/api/accountability/penalties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_date: new Date().toISOString(),
          severity: 'moderate',
          description: 'Missed leg day',
        });

      expect(res.status).toBe(201);
      expect(res.body.penalties).toHaveLength(1);
      expect(res.body.penalties[0].severity).toBe('moderate');
      expect(res.body.penalties[0].description).toBe('Missed leg day');
      expect(res.body.penalties[0].resolved).toBe(false);
    });

    it('should validate penalty severity', async () => {
      const res = await request(app)
        .post('/api/accountability/penalties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_date: new Date().toISOString(),
          severity: 'invalid',
        });

      expect(res.status).toBe(400);
    });

    it('should require workout_date', async () => {
      const res = await request(app)
        .post('/api/accountability/penalties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          severity: 'moderate',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/accountability/penalties/:penaltyId/resolve', () => {
    it('should resolve a penalty', async () => {
      // Create penalty first
      const createRes = await request(app)
        .post('/api/accountability/penalties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_date: new Date().toISOString(),
          severity: 'light',
          description: 'Skipped warmup',
        });

      const penaltyId = createRes.body.penalties[0]._id;

      const res = await request(app)
        .patch(`/api/accountability/penalties/${penaltyId}/resolve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const resolvedPenalty = res.body.penalties.find((p: { _id: string }) => p._id === penaltyId);
      expect(resolvedPenalty.resolved).toBe(true);
      expect(resolvedPenalty.resolved_date).toBeDefined();
    });

    it('should return 404 for non-existent penalty', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/accountability/penalties/${fakeId}/resolve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should validate penalty ID format', async () => {
      const res = await request(app)
        .patch('/api/accountability/penalties/invalid-id/resolve')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/accountability/penalties', () => {
    beforeEach(async () => {
      // Create accountability with multiple penalties
      await Accountability.create({
        user_id: new mongoose.Types.ObjectId(userId),
        streak: {
          current_streak: 0,
          longest_streak: 0,
        },
        penalties: [
          {
            assigned_date: new Date(),
            workout_date: new Date(),
            penalty_type: 'missed_workout',
            severity: 'light',
            resolved: false,
          },
          {
            assigned_date: new Date(),
            workout_date: new Date(),
            penalty_type: 'missed_workout',
            severity: 'moderate',
            resolved: true,
            resolved_date: new Date(),
          },
          {
            assigned_date: new Date(),
            workout_date: new Date(),
            penalty_type: 'missed_workout',
            severity: 'severe',
            resolved: false,
          },
        ],
        weekly_stats: [],
        total_workouts_completed: 0,
        total_workouts_missed: 3,
        total_penalties: 3,
      });
    });

    it('should get all penalties', async () => {
      const res = await request(app)
        .get('/api/accountability/penalties')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.penalties).toHaveLength(3);
    });

    it('should filter by resolved status', async () => {
      const res = await request(app)
        .get('/api/accountability/penalties?resolved=false')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.penalties).toHaveLength(2);
      expect(res.body.penalties.every((p: { resolved: boolean }) => !p.resolved)).toBe(true);
    });

    it('should filter by severity', async () => {
      const res = await request(app)
        .get('/api/accountability/penalties?severity=severe')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.penalties).toHaveLength(1);
      expect(res.body.penalties[0].severity).toBe('severe');
    });

    it('should combine filters', async () => {
      const res = await request(app)
        .get('/api/accountability/penalties?resolved=false&severity=light')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.penalties).toHaveLength(1);
      expect(res.body.penalties[0].severity).toBe('light');
      expect(res.body.penalties[0].resolved).toBe(false);
    });
  });

  describe('GET /api/accountability/current-week', () => {
    it('should get current week statistics', async () => {
      const res = await request(app)
        .get('/api/accountability/current-week')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('week_start');
      expect(res.body).toHaveProperty('workouts_planned');
      expect(res.body).toHaveProperty('workouts_completed');
      expect(res.body).toHaveProperty('workouts_missed');
      expect(res.body).toHaveProperty('completion_rate');
    });

    it('should calculate current week stats based on sessions', async () => {
      // Create workout sessions for current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      await WorkoutSession.create([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          workout_plan_id: new mongoose.Types.ObjectId(),
          session_date: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000),
          completion_status: 'completed',
          notes: 'Good workout',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          workout_plan_id: new mongoose.Types.ObjectId(),
          session_date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
          completion_status: 'completed',
          notes: 'Great workout',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          workout_plan_id: new mongoose.Types.ObjectId(),
          session_date: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
          completion_status: 'skipped',
          notes: 'Feeling sick',
        },
      ]);

      const res = await request(app)
        .get('/api/accountability/current-week')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workouts_planned).toBe(3);
      expect(res.body.workouts_completed).toBe(2);
      expect(res.body.workouts_missed).toBe(1);
      expect(res.body.completion_rate).toBeCloseTo(66.67, 1);
    });
  });

  describe('GET /api/accountability/weekly-stats', () => {
    it('should get weekly statistics', async () => {
      const res = await request(app)
        .get('/api/accountability/weekly-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('weekly_stats');
      expect(Array.isArray(res.body.weekly_stats)).toBe(true);
    });

    it('should limit weekly statistics', async () => {
      // Create accountability with multiple weeks
      const weeks = [];
      for (let i = 0; i < 10; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weeks.push({
          week_start: weekStart,
          workouts_planned: 5,
          workouts_completed: 4,
          workouts_missed: 1,
          completion_rate: 80,
        });
      }

      await Accountability.create({
        user_id: new mongoose.Types.ObjectId(userId),
        streak: {
          current_streak: 0,
          longest_streak: 0,
        },
        penalties: [],
        weekly_stats: weeks,
        total_workouts_completed: 40,
        total_workouts_missed: 10,
        total_penalties: 10,
      });

      const res = await request(app)
        .get('/api/accountability/weekly-stats?limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.weekly_stats).toHaveLength(5);
    });

    it('should return stats in descending order', async () => {
      const weeks = [];
      for (let i = 0; i < 3; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weeks.push({
          week_start: weekStart,
          workouts_planned: 5,
          workouts_completed: 4 - i,
          workouts_missed: 1 + i,
          completion_rate: 80 - i * 10,
        });
      }

      await Accountability.create({
        user_id: new mongoose.Types.ObjectId(userId),
        streak: {
          current_streak: 0,
          longest_streak: 0,
        },
        penalties: [],
        weekly_stats: weeks,
        total_workouts_completed: 11,
        total_workouts_missed: 4,
        total_penalties: 4,
      });

      const res = await request(app)
        .get('/api/accountability/weekly-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const stats = res.body.weekly_stats;
      for (let i = 0; i < stats.length - 1; i++) {
        const current = new Date(stats[i].week_start);
        const next = new Date(stats[i + 1].week_start);
        expect(current.getTime()).toBeGreaterThan(next.getTime());
      }
    });
  });

  describe('Streak Updates', () => {
    it('should update streak when session is completed', async () => {
      // Create a workout session
      const createRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_plan_id: new mongoose.Types.ObjectId().toString(),
          session_date: new Date().toISOString(),
          completion_status: 'in_progress',
        });

      const sessionId = createRes.body.session._id;

      // Update session to completed
      await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          completion_status: 'completed',
        });

      // Check accountability
      const accountabilityRes = await request(app)
        .get('/api/accountability')
        .set('Authorization', `Bearer ${token}`);

      expect(accountabilityRes.body.streak.current).toBe(1);
      expect(accountabilityRes.body.totals.workouts_completed).toBe(1);
    });

    it('should continue streak for consecutive workouts', async () => {
      const now = new Date();

      // Complete workout yesterday
      const session1 = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_plan_id: new mongoose.Types.ObjectId().toString(),
          session_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          completion_status: 'in_progress',
        });

      await request(app)
        .patch(`/api/sessions/${session1.body.session._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          completion_status: 'completed',
        });

      // Complete workout today
      const session2 = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          workout_plan_id: new mongoose.Types.ObjectId().toString(),
          session_date: now.toISOString(),
          completion_status: 'in_progress',
        });

      await request(app)
        .patch(`/api/sessions/${session2.body.session._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          completion_status: 'completed',
        });

      // Check streak
      const accountabilityRes = await request(app)
        .get('/api/accountability')
        .set('Authorization', `Bearer ${token}`);

      expect(accountabilityRes.body.streak.current).toBe(2);
      expect(accountabilityRes.body.streak.longest).toBe(2);
    });
  });
});
