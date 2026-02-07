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

jest.setTimeout(20000);

let authToken: string;

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI || 'mongodb://admin:changeme@mongodb:27017/personalfit-test?authSource=admin';
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});

  const signupRes = await request(app).post('/api/auth/signup').send({
    email: 'ecosystem@test.com',
    password: 'Test123!'
  });
  authToken = signupRes.body.accessToken;
});

describe('Health Ecosystem APIs', () => {
  it('should upsert and fetch habit logs', async () => {
    const logDate = new Date().toISOString().split('T')[0];

    const upsertRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        log_date: logDate,
        entries: [
          { habit_key: 'hydration', category: 'good', status: 'completed' },
          { habit_key: 'late_caffeine', category: 'bad', status: 'skipped' },
        ],
      });

    expect(upsertRes.status).toBe(201);
    expect(upsertRes.body.habitLog).toBeDefined();

    const listRes = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.logs.length).toBeGreaterThan(0);
  });

  it('should create and fetch vision scans', async () => {
    const createRes = await request(app)
      .post('/api/vision/scans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        source: 'fridge',
        image_url: 'https://example.com/scan.jpg',
        items: [{ name: 'Chicken Breast', confidence: 0.9 }],
        status: 'pending',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.scan).toBeDefined();

    const listRes = await request(app)
      .get('/api/vision/scans')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.scans.length).toBeGreaterThan(0);
  });

  it('should create and delete nutrition events', async () => {
    const createRes = await request(app)
      .post('/api/nutrition/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        source: 'manual',
        consumed_at: new Date().toISOString(),
        meal_title: 'Lunch',
        calories: 550,
        items: [{ name: 'Rice' }],
      });

    expect(createRes.status).toBe(201);
    const eventId = createRes.body.event._id;

    const listRes = await request(app)
      .get('/api/nutrition/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/nutrition/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
  });

  it('should upsert and fetch health scores', async () => {
    const scoreDate = new Date().toISOString().split('T')[0];
    const upsertRes = await request(app)
      .post('/api/health-scores')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        score_date: scoreDate,
        total_score: 78,
        pillars: { fitness: 80, habits: 75 },
        reasons: ['Consistent habits'],
      });

    expect(upsertRes.status).toBe(201);

    const listRes = await request(app)
      .get('/api/health-scores')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.scores.length).toBeGreaterThan(0);
  });

  it('should track analytics events', async () => {
    const res = await request(app)
      .post('/api/analytics/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        event_name: 'habit_checkin_saved',
        metadata: { source: 'dashboard' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
