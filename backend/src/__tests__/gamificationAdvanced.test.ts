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
import app from '../app';

const VALID_PASSWORD = 'TestPassword123';

describe('Leaderboard Controller', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up and register a new user
    const email = `leaderboard-test-${Date.now()}@test.com`;

    const signupRes = await request(app).post('/api/auth/signup').send({
      email,
      password: VALID_PASSWORD,
    });

    authToken = signupRes.body.accessToken;
    testUserId = signupRes.body.user.id;

    // Update user with gamification data
    await User.findByIdAndUpdate(testUserId, {
      gamification: {
        level: 15,
        xp: 4500,
        gems: 150,
        total_workouts_completed: 45,
        current_streak: 21,
        longest_streak: 45,
        achievements: [],
        total_prs: 8,
        streak_freezes_available: 2,
        streak_freezes_used_this_month: 0,
        purchased_items: [],
        milestone_rewards_claimed: [],
      },
    });
  });

  describe('GET /api/gamification/leaderboard/global', () => {
    it('should return global leaderboard with pagination', async () => {
      const res = await request(app)
        .get('/api/gamification/leaderboard/global?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('leaderboard');
      expect(res.body).toHaveProperty('totalUsers');
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const res1 = await request(app)
        .get('/api/gamification/leaderboard/global?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.leaderboard.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/gamification/leaderboard/weekly', () => {
    it('should return weekly leaderboard', async () => {
      const res = await request(app)
        .get('/api/gamification/leaderboard/weekly?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('leaderboard');
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
    });
  });

  describe('GET /api/gamification/leaderboard/rank', () => {
    it('should return user rank with nearby competitors', async () => {
      const res = await request(app)
        .get('/api/gamification/leaderboard/rank')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userRank');
      expect(res.body).toHaveProperty('nearbyLeaderboard');
      expect(Array.isArray(res.body.nearbyLeaderboard)).toBe(true);
    });
  });
});

describe('Rewards Shop Controller', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const email = `shop-test-${Date.now()}@test.com`;

    const signupRes = await request(app).post('/api/auth/signup').send({
      email,
      password: VALID_PASSWORD,
    });

    authToken = signupRes.body.accessToken;
    testUserId = signupRes.body.user.id;

    // Update user with gem balance
    await User.findByIdAndUpdate(testUserId, {
      gamification: {
        level: 10,
        xp: 2000,
        gems: 200,
        total_workouts_completed: 30,
        current_streak: 15,
        longest_streak: 30,
        achievements: [],
        total_prs: 5,
        streak_freezes_available: 2,
        streak_freezes_used_this_month: 0,
        purchased_items: [],
        milestone_rewards_claimed: [],
      },
    });
  });

  describe('GET /api/gamification/shop', () => {
    it('should return available shop items', async () => {
      const res = await request(app)
        .get('/api/gamification/shop')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('userGems');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/gamification/shop?category=theme')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
    });
  });

  describe('GET /api/gamification/gems', () => {
    it('should return gem balance', async () => {
      const res = await request(app)
        .get('/api/gamification/gems')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentGems');
      expect(res.body).toHaveProperty('totalGemsEarned');
      expect(typeof res.body.currentGems).toBe('number');
    });
  });

  describe('POST /api/gamification/shop/purchase', () => {
    it('should purchase an item successfully', async () => {
      // Get shop items first
      const itemRes = await request(app)
        .get('/api/gamification/shop')
        .set('Authorization', `Bearer ${authToken}`);

      interface ShopItem {
        id: string;
        gemsPrice: number;
        owned: boolean;
      }
      const cheapItem = itemRes.body.items.find(
        (item: ShopItem) => item.gemsPrice <= itemRes.body.userGems && !item.owned
      );

      if (!cheapItem) {
        // Skip if no affordable items
        return;
      }

      const res = await request(app)
        .post('/api/gamification/shop/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: cheapItem.id });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
    });

    it('should fail if insufficient gems', async () => {
      // Create user with low gems
      const lowGemEmail = `lowgem-test-${Date.now()}@test.com`;
      const lowGemRes = await request(app).post('/api/auth/signup').send({
        email: lowGemEmail,
        password: VALID_PASSWORD,
      });

      const lowGemToken = lowGemRes.body.accessToken;
      const lowGemUserId = lowGemRes.body.user.id;

      await User.findByIdAndUpdate(lowGemUserId, {
        gamification: {
          level: 1,
          xp: 0,
          gems: 5,
          total_workouts_completed: 0,
          current_streak: 0,
          longest_streak: 0,
          achievements: [],
          total_prs: 0,
          streak_freezes_available: 0,
          streak_freezes_used_this_month: 0,
          purchased_items: [],
          milestone_rewards_claimed: [],
        },
      });

      // Try to purchase expensive item
      const res = await request(app)
        .post('/api/gamification/shop/purchase')
        .set('Authorization', `Bearer ${lowGemToken}`)
        .send({ itemId: 'theme_neon' }); // 100 gems

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/gamification/shop/claim-rewards', () => {
    it('should claim milestone rewards', async () => {
      // Create user with high level to claim rewards
      const highLevelEmail = `highlevel-test-${Date.now()}@test.com`;
      const highLevelRes = await request(app).post('/api/auth/signup').send({
        email: highLevelEmail,
        password: VALID_PASSWORD,
      });

      const highLevelToken = highLevelRes.body.accessToken;
      const highLevelUserId = highLevelRes.body.user.id;

      // Set to level 5 (milestone)
      await User.findByIdAndUpdate(highLevelUserId, {
        gamification: {
          level: 5,
          xp: 500,
          gems: 0,
          total_workouts_completed: 10,
          current_streak: 8,
          longest_streak: 8,
          achievements: [],
          total_prs: 2,
          streak_freezes_available: 0,
          streak_freezes_used_this_month: 0,
          purchased_items: [],
          milestone_rewards_claimed: [],
        },
      });

      const res = await request(app)
        .post('/api/gamification/shop/claim-rewards')
        .set('Authorization', `Bearer ${highLevelToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});
