/**
 * Atomic Operations Test Suite (S1-1)
 *
 * Tests race condition prevention in gem/XP operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Helper to create auth token
const createToken = (userId: string): string => {
  return jwt.sign({ userId, email: 'test@test.com' }, JWT_SECRET, { expiresIn: '1h' });
};

// Helper to create test user with gamification
const createTestUser = async (gems: number = 100, purchases: string[] = []): Promise<IUser & { _id: mongoose.Types.ObjectId }> => {
  const user = await User.create({
    email: `test-${Date.now()}-${Math.random()}@test.com`,
    password_hash: 'hashedpassword123',
    gamification: {
      xp: 0,
      level: 1,
      total_workouts_completed: 0,
      current_streak: 0,
      longest_streak: 0,
      achievements: [],
      total_prs: 0,
      streak_freezes_available: 2,
      streak_freezes_used_this_month: 0,
      gems: gems,
      total_gems_earned: gems,
      purchased_items: purchases,
      milestone_rewards_claimed: [],
    },
  });
  return user as IUser & { _id: mongoose.Types.ObjectId };
};

describe('Atomic Operations - Race Condition Prevention', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Shop Purchase - Atomic Gem Deduction', () => {
    it('should prevent purchasing same item twice via race condition', async () => {
      const user = await createTestUser(500, []);
      const token = createToken(user._id.toString());

      // Simulate two concurrent purchase requests for the same item
      const results = await Promise.all([
        request(app)
          .post('/api/gamification/shop/purchase')
          .set('Authorization', `Bearer ${token}`)
          .send({ itemId: 'theme_ocean' }),
        request(app)
          .post('/api/gamification/shop/purchase')
          .set('Authorization', `Bearer ${token}`)
          .send({ itemId: 'theme_ocean' }),
      ]);

      // One should succeed, one should fail
      const successes = results.filter((r) => r.status === 200);
      const failures = results.filter((r) => r.status === 400);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);

      // Verify item was only purchased once
      const updatedUser = await User.findById(user._id);
      const itemCount = updatedUser?.gamification?.purchased_items?.filter(
        (i) => i === 'theme_ocean'
      ).length;
      expect(itemCount).toBe(1);
    });

    it('should prevent double gem deduction via race condition', async () => {
      // User has exactly enough gems for one purchase
      const itemCost = 50; // theme_ocean costs 50 gems
      const user = await createTestUser(itemCost, []);
      const token = createToken(user._id.toString());

      // Two concurrent purchases - only one should succeed
      const results = await Promise.all([
        request(app)
          .post('/api/gamification/shop/purchase')
          .set('Authorization', `Bearer ${token}`)
          .send({ itemId: 'theme_ocean' }),
        request(app)
          .post('/api/gamification/shop/purchase')
          .set('Authorization', `Bearer ${token}`)
          .send({ itemId: 'theme_sunset' }), // Different item, same cost
      ]);

      const successes = results.filter((r) => r.status === 200);

      // Only one should succeed (user only has gems for one item)
      expect(successes.length).toBe(1);

      // Verify gems are not negative
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.gamification?.gems).toBeGreaterThanOrEqual(0);
    });

    it('should correctly deduct gems for valid singular purchase', async () => {
      const initialGems = 100;
      const user = await createTestUser(initialGems, []);
      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/shop/purchase')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: 'theme_ocean' }); // 50 gems

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.gemsRemaining).toBe(initialGems - 50);
    });

    it('should reject purchase when insufficient gems', async () => {
      const user = await createTestUser(10, []); // Only 10 gems
      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/shop/purchase')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: 'theme_ocean' }); // 50 gems required

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Not enough gems');
    });

    it('should reject purchase of already owned item', async () => {
      const user = await createTestUser(100, ['theme_ocean']);
      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/shop/purchase')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: 'theme_ocean' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already purchased');
    });
  });

  describe('XP Award - Atomic Operations', () => {
    it('should award XP correctly for single workout', async () => {
      const user = await createTestUser(100, []);
      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/award-xp')
        .set('Authorization', `Bearer ${token}`)
        .send({ hadPersonalRecord: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.xpAwarded).toBeGreaterThan(0);
    });

    it('should handle concurrent XP awards using optimistic locking', async () => {
      const user = await createTestUser(100, []);
      const token = createToken(user._id.toString());

      // Simulate multiple concurrent workout completions
      const results = await Promise.all([
        request(app)
          .post('/api/gamification/award-xp')
          .set('Authorization', `Bearer ${token}`)
          .send({ hadPersonalRecord: false }),
        request(app)
          .post('/api/gamification/award-xp')
          .set('Authorization', `Bearer ${token}`)
          .send({ hadPersonalRecord: false }),
      ]);

      // Both should eventually succeed (with retries)
      // Or one may return 409 if max retries exceeded
      const successes = results.filter((r) => r.status === 200);
      const conflicts = results.filter((r) => r.status === 409);

      // At least one should succeed
      expect(successes.length + conflicts.length).toBe(2);
      expect(successes.length).toBeGreaterThanOrEqual(1);

      // Verify XP was awarded (at least once)
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.gamification?.xp).toBeGreaterThan(0);
      expect(updatedUser?.gamification?.total_workouts_completed).toBeGreaterThanOrEqual(1);
    });

    it('should update streak correctly', async () => {
      const user = await createTestUser(100, []);
      // Set last workout to yesterday
      user.gamification!.last_workout_date = new Date(Date.now() - 24 * 60 * 60 * 1000);
      user.gamification!.current_streak = 5;
      await user.save();

      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/award-xp')
        .set('Authorization', `Bearer ${token}`)
        .send({ hadPersonalRecord: false });

      expect(res.status).toBe(200);
      expect(res.body.currentStreak).toBe(6); // Streak continued
    });

    it('should reset streak if workout is too late', async () => {
      const user = await createTestUser(100, []);
      // Set last workout to 3 days ago
      user.gamification!.last_workout_date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      user.gamification!.current_streak = 5;
      await user.save();

      const token = createToken(user._id.toString());

      const res = await request(app)
        .post('/api/gamification/award-xp')
        .set('Authorization', `Bearer ${token}`)
        .send({ hadPersonalRecord: false });

      expect(res.status).toBe(200);
      expect(res.body.currentStreak).toBe(1); // Streak reset
      expect(res.body.streakBroken).toBe(true);
    });
  });

  describe('Milestone Rewards - Atomic Claiming', () => {
    it('should prevent double claiming via race condition', async () => {
      const user = await createTestUser(50, []);
      user.gamification!.level = 5; // Level 5 unlocks a milestone
      user.gamification!.milestone_rewards_claimed = [];
      await user.save();

      const token = createToken(user._id.toString());

      // Two concurrent claims
      const results = await Promise.all([
        request(app)
          .post('/api/gamification/shop/claim-rewards')
          .set('Authorization', `Bearer ${token}`)
          .send({}),
        request(app)
          .post('/api/gamification/shop/claim-rewards')
          .set('Authorization', `Bearer ${token}`)
          .send({}),
      ]);

      // Both should return 200, but only one should have actual rewards
      const rewardsGiven = results.filter((r) => r.body.totalGemsAwarded > 0);

      // Only one should actually give rewards
      expect(rewardsGiven.length).toBe(1);

      // Verify milestone was only claimed once
      const updatedUser = await User.findById(user._id);
      const milestone5Count = updatedUser?.gamification?.milestone_rewards_claimed?.filter(
        (m) => m === 'milestone_5'
      ).length;
      expect(milestone5Count).toBeLessThanOrEqual(1);
    });
  });
});
