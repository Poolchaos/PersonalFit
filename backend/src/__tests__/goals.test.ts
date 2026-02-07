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
import jwt from 'jsonwebtoken';
import app from '../app';
import User from '../models/User';
import Goal from '../models/Goal';

describe('Goals API', () => {
  let authToken: string;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/personalfit_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});

    const user = await User.create({
      email: 'goals@test.com',
      password: 'Test123!@#',
      profile: { first_name: 'Goals', last_name: 'Tester' },
    });
    userId = user._id as mongoose.Types.ObjectId;
    authToken = jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/goals', () => {
    it('should create a weight loss goal (decrease type)', async () => {
      const goalData = {
        name: 'Lose Weight',
        description: 'Get down to healthy weight',
        type: 'decrease',
        category: 'weight_loss',
        initial_value: 165,
        target_value: 95,
        unit: 'kg',
        target_date: '2026-12-31',
      };

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(res.body.goal).toBeDefined();
      expect(res.body.goal.name).toBe('Lose Weight');
      expect(res.body.goal.type).toBe('decrease');
      expect(res.body.goal.initial_value).toBe(165);
      expect(res.body.goal.current_value).toBe(165); // Default to initial
      expect(res.body.goal.target_value).toBe(95);
      expect(res.body.goal.progress_percentage).toBe(0);
      expect(res.body.goal.status).toBe('active');
    });

    it('should create a muscle gain goal (increase type)', async () => {
      const goalData = {
        name: 'Gain Muscle',
        type: 'increase',
        category: 'muscle_gain',
        initial_value: 70,
        target_value: 80,
        unit: 'kg',
      };

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(res.body.goal.type).toBe('increase');
      expect(res.body.goal.initial_value).toBe(70);
      expect(res.body.goal.target_value).toBe(80);
    });

    it('should create an accumulation goal', async () => {
      const goalData = {
        name: 'Complete 100 Workouts',
        type: 'accumulate',
        category: 'workout_frequency',
        initial_value: 0,
        target_value: 100,
        unit: 'workouts',
      };

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(res.body.goal.type).toBe('accumulate');
      expect(res.body.goal.target_value).toBe(100);
    });

    it('should create a target goal', async () => {
      const goalData = {
        name: 'Run 5K under 25 minutes',
        type: 'target',
        category: 'endurance',
        initial_value: 30,
        target_value: 25,
        unit: 'minutes',
      };

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(res.body.goal.type).toBe('target');
    });

    it('should reject invalid goal type', async () => {
      const goalData = {
        name: 'Invalid Goal',
        type: 'invalid_type',
        category: 'general',
        initial_value: 0,
        target_value: 100,
        unit: 'points',
      };

      await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(400);
    });

    it('should require authentication', async () => {
      const goalData = {
        name: 'Test Goal',
        type: 'increase',
        category: 'general',
        initial_value: 0,
        target_value: 100,
        unit: 'points',
      };

      await request(app).post('/api/goals').send(goalData).expect(401);
    });
  });

  describe('GET /api/goals', () => {
    beforeEach(async () => {
      await Goal.create([
        {
          user_id: userId,
          name: 'Active Goal 1',
          type: 'increase',
          category: 'strength',
          initial_value: 50,
          current_value: 60,
          target_value: 100,
          unit: 'kg',
          status: 'active',
        },
        {
          user_id: userId,
          name: 'Completed Goal',
          type: 'accumulate',
          category: 'workout_frequency',
          initial_value: 0,
          current_value: 100,
          target_value: 100,
          unit: 'workouts',
          status: 'completed',
        },
        {
          user_id: userId,
          name: 'Active Goal 2',
          type: 'decrease',
          category: 'weight_loss',
          initial_value: 165,
          current_value: 150,
          target_value: 95,
          unit: 'kg',
          status: 'active',
        },
      ]);
    });

    it('should get all goals for the user', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.goals).toHaveLength(3);
      expect(res.body.goals[0].name).toBeDefined();
    });

    it('should filter goals by status', async () => {
      const res = await request(app)
        .get('/api/goals?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.goals).toHaveLength(2);
      expect(res.body.goals.every((g: { status: string }) => g.status === 'active')).toBe(true);
    });

    it('should filter goals by category', async () => {
      const res = await request(app)
        .get('/api/goals?category=weight_loss')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.goals).toHaveLength(1);
      expect(res.body.goals[0].category).toBe('weight_loss');
    });
  });

  describe('GET /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      const goal = await Goal.create({
        user_id: userId,
        name: 'Test Goal',
        type: 'increase',
        category: 'strength',
        initial_value: 50,
        current_value: 60,
        target_value: 100,
        unit: 'kg',
      });
      goalId = (goal._id as mongoose.Types.ObjectId).toString();
    });

    it('should get a goal by ID', async () => {
      const res = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.goal._id).toBe(goalId);
      expect(res.body.goal.name).toBe('Test Goal');
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/goals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not return another user\'s goal', async () => {
      const otherUser = await User.create({
        email: 'other@test.com',
        password: 'Test123!@#',
        profile: { first_name: 'Other', last_name: 'User' },
      });
      const otherUserId = otherUser._id as mongoose.Types.ObjectId;

      const otherGoal = await Goal.create({
        user_id: otherUserId,
        name: 'Other Goal',
        type: 'increase',
        category: 'strength',
        initial_value: 50,
        current_value: 60,
        target_value: 100,
        unit: 'kg',
      });

      await request(app)
        .get(`/api/goals/${otherGoal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/goals/:id/progress', () => {
    let goalId: string;

    beforeEach(async () => {
      const goal = await Goal.create({
        user_id: userId,
        name: 'Weight Loss',
        type: 'decrease',
        category: 'weight_loss',
        initial_value: 165,
        current_value: 165,
        target_value: 95,
        unit: 'kg',
      });
      goalId = (goal._id as mongoose.Types.ObjectId).toString();
    });

    it('should update progress for decrease goal', async () => {
      const res = await request(app)
        .patch(`/api/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ current_value: 150 })
        .expect(200);

      expect(res.body.goal.current_value).toBe(150);
      // Progress: (165 - 150) / (165 - 95) = 15 / 70 = 21.4%
      expect(res.body.goal.progress_percentage).toBeCloseTo(21.43, 1);
      expect(res.body.goal.status).toBe('active');
    });

    it('should auto-complete goal when target reached', async () => {
      const res = await request(app)
        .patch(`/api/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ current_value: 95 })
        .expect(200);

      expect(res.body.goal.current_value).toBe(95);
      expect(res.body.goal.progress_percentage).toBe(100);
      expect(res.body.goal.status).toBe('completed');
      expect(res.body.goal.completed_date).toBeDefined();
    });

    it('should handle increase goal progress correctly', async () => {
      const increaseGoal = await Goal.create({
        user_id: userId,
        name: 'Muscle Gain',
        type: 'increase',
        category: 'muscle_gain',
        initial_value: 70,
        current_value: 70,
        target_value: 80,
        unit: 'kg',
      });

      const res = await request(app)
        .patch(`/api/goals/${increaseGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ current_value: 75 })
        .expect(200);

      // Progress: (75 - 70) / (80 - 70) = 5 / 10 = 50%
      expect(res.body.goal.progress_percentage).toBe(50);
    });

    it('should handle accumulate goal correctly', async () => {
      const accumulateGoal = await Goal.create({
        user_id: userId,
        name: '100 Workouts',
        type: 'accumulate',
        category: 'workout_frequency',
        initial_value: 0,
        current_value: 0,
        target_value: 100,
        unit: 'workouts',
      });

      const res = await request(app)
        .patch(`/api/goals/${accumulateGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ current_value: 45 })
        .expect(200);

      expect(res.body.goal.progress_percentage).toBe(45);
    });
  });

  describe('PATCH /api/goals/:id/status', () => {
    let goalId: string;

    beforeEach(async () => {
      const goal = await Goal.create({
        user_id: userId,
        name: 'Test Goal',
        type: 'increase',
        category: 'strength',
        initial_value: 50,
        current_value: 60,
        target_value: 100,
        unit: 'kg',
      });
      goalId = (goal._id as mongoose.Types.ObjectId).toString();
    });

    it('should update goal status', async () => {
      const res = await request(app)
        .patch(`/api/goals/${goalId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'paused' })
        .expect(200);

      expect(res.body.goal.status).toBe('paused');
    });

    it('should set completed_date when completing goal', async () => {
      const res = await request(app)
        .patch(`/api/goals/${goalId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(res.body.goal.status).toBe('completed');
      expect(res.body.goal.completed_date).toBeDefined();
    });

    it('should reject invalid status', async () => {
      await request(app)
        .patch(`/api/goals/${goalId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('PUT /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      const goal = await Goal.create({
        user_id: userId,
        name: 'Original Name',
        type: 'increase',
        category: 'strength',
        initial_value: 50,
        current_value: 60,
        target_value: 100,
        unit: 'kg',
      });
      goalId = (goal._id as mongoose.Types.ObjectId).toString();
    });

    it('should update goal details', async () => {
      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          description: 'New description',
          target_value: 120,
        })
        .expect(200);

      expect(res.body.goal.name).toBe('Updated Name');
      expect(res.body.goal.description).toBe('New description');
      expect(res.body.goal.target_value).toBe(120);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      const goal = await Goal.create({
        user_id: userId,
        name: 'Test Goal',
        type: 'increase',
        category: 'strength',
        initial_value: 50,
        current_value: 60,
        target_value: 100,
        unit: 'kg',
      });
      goalId = (goal._id as mongoose.Types.ObjectId).toString();
    });

    it('should delete a goal', async () => {
      await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const goal = await Goal.findById(goalId);
      expect(goal).toBeNull();
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/goals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/goals/stats', () => {
    beforeEach(async () => {
      await Goal.create([
        {
          user_id: userId,
          name: 'Active 1',
          type: 'increase',
          category: 'strength',
          initial_value: 0,
          current_value: 50,
          target_value: 100,
          unit: 'kg',
          status: 'active',
        },
        {
          user_id: userId,
          name: 'Active 2',
          type: 'decrease',
          category: 'weight_loss',
          initial_value: 100,
          current_value: 75,
          target_value: 50,
          unit: 'kg',
          status: 'active',
        },
        {
          user_id: userId,
          name: 'Completed',
          type: 'accumulate',
          category: 'workout_frequency',
          initial_value: 0,
          current_value: 100,
          target_value: 100,
          unit: 'workouts',
          status: 'completed',
        },
        {
          user_id: userId,
          name: 'Abandoned',
          type: 'increase',
          category: 'general',
          initial_value: 0,
          current_value: 10,
          target_value: 100,
          unit: 'points',
          status: 'abandoned',
        },
      ]);
    });

    it('should return goal statistics', async () => {
      const res = await request(app)
        .get('/api/goals/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.stats.total).toBe(4);
      expect(res.body.stats.active).toBe(2);
      expect(res.body.stats.completed).toBe(1);
      expect(res.body.stats.abandoned).toBe(1);
      expect(res.body.stats.average_progress).toBeGreaterThan(0);
    });
  });
});
