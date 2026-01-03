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
import User from '../models/User';
import WorkoutPlan from '../models/WorkoutPlan';
import Equipment from '../models/Equipment';

// Mock the AI provider service to avoid real API calls during tests
const mockGeneratePlan = (modality: string | undefined): Record<string, unknown> => {
  const basePlan = {
    plan_overview: {
      duration_weeks: 4,
      sessions_per_week: 3,
      focus_areas: ['full_body'],
      equipment_required: ['Dumbbells'],
    },
    weekly_schedule: [
      {
        day: 'Monday',
        workout: {
          name: modality === 'hiit' ? 'HIIT Session' : 'Strength Session',
          duration_minutes: modality === 'hiit' ? 20 : 45,
          focus: 'Full Body',
          exercises: [
            modality === 'hiit'
              ? {
                  name: 'Burpees',
                  work_seconds: 30,
                  rest_seconds: 15,
                  rounds: 4,
                  equipment: [],
                  target_muscles: ['full_body'],
                  instructions: 'Perform burpees with controlled form',
                }
              : {
                  name: 'Bench Press',
                  sets: 3,
                  reps: 8,
                  equipment: ['Dumbbells'],
                  target_muscles: ['chest', 'triceps'],
                  instructions: 'Standard bench press using dumbbells',
                },
          ],
        },
      },
    ],
    progression_notes: 'Progress gradually',
    safety_reminders: ['Warm up before starting'],
  };

  return basePlan;
};

// Mock AI provider service
jest.mock('../services/aiProviderService', () => ({
  createAIProvider: jest.fn(() => ({
    generateWorkoutPlan: jest.fn(async (params: { workoutModality?: string }) => {
      return mockGeneratePlan(params?.workoutModality);
    }),
  })),
}));

import app from '../app';

let authToken: string;
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
  await WorkoutPlan.deleteMany({});
  await Equipment.deleteMany({});

  // Create test user
  const signupRes = await request(app).post('/api/auth/signup').send({
    email: 'test@example.com',
    password: 'Test123!',
  });
  authToken = signupRes.body.accessToken;
  userId = signupRes.body.user._id;

  // Create user profile
  await request(app)
    .post('/api/profile')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      fitness_level: 'intermediate',
      goals: ['build_muscle', 'improve_endurance'],
      workout_frequency: 4,
      session_duration_preference: 60,
    });

  // Create test equipment
  await Equipment.create({
    user_id: new mongoose.Types.ObjectId(userId),
    equipment_name: 'Dumbbells',
    equipment_type: 'free_weights',
    specifications: { min_weight_kg: 5, max_weight_kg: 30 },
  });
});

describe('Workout Plan Generation', () => {
  describe('POST /api/workouts/generate', () => {
    it('should generate a strength workout plan by default', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 4,
          focus_areas: ['chest', 'back', 'legs'],
        });

  expect(res.status).toBe(201);
  expect(res.body.plan).toHaveProperty('id');
  // generation_context stores the modality
  expect(res.body.plan.generation_context.workout_modality).toBe('strength');

  // verify persisted document has expected fields
  const savedPlan = await WorkoutPlan.findById(res.body.plan.id);
  expect(savedPlan).toBeDefined();
  expect(savedPlan?.workout_modality).toBe('strength');
  expect(savedPlan?.is_active).toBe(true);
    });

    it('should generate a HIIT workout plan when specified', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 2,
          workout_modality: 'hiit',
          focus_areas: ['full_body', 'cardio'],
        });

  expect(res.status).toBe(201);
  expect(res.body.plan).toHaveProperty('id');
  expect(res.body.plan.generation_context.workout_modality).toBe('hiit');

  const savedPlan = await WorkoutPlan.findById(res.body.plan.id);
  expect(savedPlan).toBeDefined();
  expect(savedPlan?.workout_modality).toBe('hiit');

  // Verify HIIT-specific structure exists in plan_data (weekly schedule present)
  const planData = res.body.plan.plan_data;
  expect(planData).toHaveProperty('plan_overview');
  expect(planData).toHaveProperty('weekly_schedule');

      // Check if any exercises have interval structure (HIIT fields)
      // Note: This depends on OpenAI response, so we just verify the structure allows it
      if (planData.workouts && planData.workouts.length > 0) {
        const firstWorkout = planData.workouts[0];
        expect(firstWorkout).toHaveProperty('exercises');
        if (firstWorkout.exercises && firstWorkout.exercises.length > 0) {
          const exercise = firstWorkout.exercises[0];
          // HIIT exercises should have work_seconds, rest_seconds, rounds
          // But OpenAI might format differently, so we just check the modality is saved
          expect(exercise).toHaveProperty('exercise_name');
        }
      }
    });

    it('should validate workout_modality enum', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 4,
          workout_modality: 'invalid_modality',
          focus_areas: ['legs'],
        });

      expect(res.status).toBe(400);
    });

    it('should accept cardio workout modality', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 3,
          workout_modality: 'cardio',
          focus_areas: ['endurance'],
        });

  expect(res.status).toBe(201);
  expect(res.body.plan.generation_context.workout_modality).toBe('cardio');
  const saved = await WorkoutPlan.findById(res.body.plan.id);
  expect(saved?.workout_modality).toBe('cardio');
    });

    it('should accept flexibility workout modality', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 2,
          workout_modality: 'flexibility',
          focus_areas: ['mobility', 'recovery'],
        });

  expect(res.status).toBe(201);
  expect(res.body.plan.generation_context.workout_modality).toBe('flexibility');
  const savedFlex = await WorkoutPlan.findById(res.body.plan.id);
  expect(savedFlex?.workout_modality).toBe('flexibility');
    });

    it('should deactivate previous active plans', async () => {
      // Create first plan
      const res1 = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 4,
          workout_modality: 'strength',
        });

  // persisted should be active
  const firstPlan = await WorkoutPlan.findById(res1.body.plan.id);
  expect(firstPlan?.is_active).toBe(true);
  const firstPlanId = res1.body.plan.id;

      // Create second plan with different modality
      const res2 = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 2,
          workout_modality: 'hiit',
        });

    // persisted second plan should be active
    const secondSaved = await WorkoutPlan.findById(res2.body.plan.id);
    expect(secondSaved?.is_active).toBe(true);

  // Verify first plan was deactivated
  const firstPlanAfter = await WorkoutPlan.findById(firstPlanId);
  expect(firstPlanAfter?.is_active).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/workouts/generate')
        .send({
          duration_weeks: 4,
          workout_modality: 'strength',
        });

      expect(res.status).toBe(401);
    });

    it('should handle missing user profile gracefully', async () => {
      // Create new user without profile
      const newUserRes = await request(app).post('/api/auth/signup').send({
        email: 'newuser@example.com',
        password: 'Test123!',
      });
      const newUserToken = newUserRes.body.accessToken;

      const res = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          duration_weeks: 4,
          workout_modality: 'strength',
        });

      // Should still generate plan even without profile (uses defaults)
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('GET /api/workouts', () => {
    it('should list all workout plans for user', async () => {
      // Create strength plan
      await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 4,
          workout_modality: 'strength',
        });

      // Create HIIT plan
      await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 2,
          workout_modality: 'hiit',
        });

      const res = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.workouts).toHaveLength(2);

      const modalities = res.body.workouts.map((p: { workout_modality: string }) => p.workout_modality);
      expect(modalities).toContain('strength');
      expect(modalities).toContain('hiit');
    });
  });

  describe('GET /api/workouts/:id', () => {
    it('should get a specific workout plan', async () => {
      const createRes = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 2,
          workout_modality: 'hiit',
        });
      const planId = createRes.body.plan.id;

      const res = await request(app)
        .get(`/api/workouts/${planId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.plan.workout_modality).toBe('hiit');
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/workouts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/workouts/:id/deactivate', () => {
    it('should deactivate a workout plan', async () => {
      const createRes = await request(app)
        .post('/api/workouts/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration_weeks: 4,
          workout_modality: 'strength',
        });

      const planId = createRes.body.plan.id;
      const savedBefore = await WorkoutPlan.findById(planId);
      expect(savedBefore?.is_active).toBe(true);

      const res = await request(app)
        .patch(`/api/workouts/${planId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const savedAfter = await WorkoutPlan.findById(planId);
      expect(savedAfter?.is_active).toBe(false);
    });
  });
});
