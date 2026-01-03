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

describe('Profile API', () => {
  let authToken: string;

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

    // Create a test user and get token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    authToken = signupResponse.body.accessToken;
  });

  describe('GET /api/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('profile');
      expect(response.body.user).toHaveProperty('preferences');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile information', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile: {
            first_name: 'John',
            last_name: 'Doe',
            height_cm: 180,
            weight_kg: 80,
            fitness_goals: ['weight_loss', 'muscle_gain'],
            experience_level: 'intermediate',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.profile.first_name).toBe('John');
      expect(response.body.user.profile.last_name).toBe('Doe');
      expect(response.body.user.profile.height_cm).toBe(180);
      expect(response.body.user.profile.experience_level).toBe('intermediate');
    });

    it('should update preferences', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferences: {
            preferred_workout_days: ['Monday', 'Wednesday', 'Friday'],
            preferred_workout_duration: 60,
            equipment_access: ['dumbbells', 'resistance_bands'],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.user.preferences.preferred_workout_days).toEqual([
        'Monday',
        'Wednesday',
        'Friday',
      ]);
      expect(response.body.user.preferences.preferred_workout_duration).toBe(60);
    });

    it('should validate height_cm range', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile: {
            height_cm: 500,
          },
        });

      expect(response.status).toBe(400);
    });

    it('should validate experience_level enum', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile: {
            experience_level: 'invalid',
          },
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({
          profile: { first_name: 'John' },
        });

      expect(response.status).toBe(401);
    });
  });
});
