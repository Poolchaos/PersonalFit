/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
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
import RefreshToken from '../models/RefreshToken';

// Valid password meeting all requirements: uppercase, lowercase, number
const VALID_PASSWORD = 'Password123';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumi-test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: VALID_PASSWORD,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password456',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: VALID_PASSWORD,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token (rotation)', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const refreshToken = signupResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      // New refresh token should be different (rotation)
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('should invalidate old refresh token after rotation', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const oldRefreshToken = signupResponse.body.refreshToken;

      // First refresh should succeed
      const firstResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(firstResponse.status).toBe(200);

      // Second refresh with old token should fail (token reuse detection)
      const secondResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(secondResponse.status).toBe(401);
      expect(secondResponse.body.error).toContain('all sessions revoked');
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke refresh token on logout', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const refreshToken = signupResponse.body.refreshToken;

      // Logout should succeed
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logged out successfully');

      // Refresh with the revoked token should fail
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should revoke all refresh tokens for user', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const accessToken = signupResponse.body.accessToken;
      const refreshToken1 = signupResponse.body.refreshToken;

      // Login again to get another refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: VALID_PASSWORD,
        });

      const refreshToken2 = loginResponse.body.refreshToken;

      // Logout all devices
      const logoutAllResponse = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(logoutAllResponse.status).toBe(200);
      expect(logoutAllResponse.body.sessions_revoked).toBe(2);

      // Both refresh tokens should now be invalid
      const refresh1Response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken1 });

      expect(refresh1Response.status).toBe(401);

      const refresh2Response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 });

      expect(refresh2Response.status).toBe(401);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
