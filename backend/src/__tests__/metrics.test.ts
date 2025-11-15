import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import BodyMetrics from '../models/BodyMetrics';

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
  await BodyMetrics.deleteMany({});

  // Create test user
  const signupRes = await request(app).post('/api/auth/signup').send({
    email: 'test@example.com',
    password: 'Test123!',
  });
  authToken = signupRes.body.accessToken;
  userId = signupRes.body.user.id;
});

describe('Body Metrics Management', () => {
  describe('POST /api/metrics', () => {
    it('should create new body metrics entry', async () => {
      const metricsData = {
        measurement_date: new Date('2024-01-15').toISOString(),
        weight_kg: 75.5,
        body_fat_percentage: 18.5,
        measurements: {
          chest_cm: 100,
          waist_cm: 85,
          hips_cm: 95,
        },
        notes: 'Feeling strong today',
      };

      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(metricsData);

      expect(res.status).toBe(201);
      expect(res.body.metrics).toHaveProperty('_id');
      expect(res.body.metrics.weight_kg).toBe(75.5);
      expect(res.body.metrics.body_fat_percentage).toBe(18.5);
      expect(res.body.metrics.measurements.chest_cm).toBe(100);
    });

    it('should validate weight range', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          measurement_date: new Date().toISOString(),
          weight_kg: 600, // Invalid: too high
        });

      expect(res.status).toBe(400);
    });

    it('should validate body fat percentage range', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          measurement_date: new Date().toISOString(),
          body_fat_percentage: 85, // Invalid: too high
        });

      expect(res.status).toBe(400);
    });

    it('should prevent duplicate entries for same date', async () => {
      const metricsData = {
        measurement_date: new Date('2024-01-15').toISOString(),
        weight_kg: 75.5,
      };

      await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(metricsData);

      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(metricsData);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exist');
    });

    it('should validate measurement date format', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          measurement_date: 'invalid-date',
          weight_kg: 75,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/metrics', () => {
    beforeEach(async () => {
      // Create multiple metrics entries
      const dates = ['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22'];
      for (const date of dates) {
        await BodyMetrics.create({
          user_id: userId,
          measurement_date: new Date(date),
          weight_kg: 75 + dates.indexOf(date),
          body_fat_percentage: 18 - dates.indexOf(date) * 0.5,
        });
      }
    });

    it('should list all metrics for user', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(4);
      expect(res.body.pagination.total).toBe(4);
    });

    it('should filter metrics by date range', async () => {
      const res = await request(app)
        .get('/api/metrics?from_date=2024-01-08&to_date=2024-01-15')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/metrics?limit=2&skip=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(2);
      expect(res.body.pagination.total).toBe(4);
      expect(res.body.pagination.has_more).toBe(true);
    });

    it('should sort by date descending', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.metrics.map((m: { measurement_date: string }) =>
        new Date(m.measurement_date).getTime()
      );
      expect(dates[0]).toBeGreaterThan(dates[1]);
    });
  });

  describe('GET /api/metrics/latest', () => {
    it('should return latest metrics entry', async () => {
      await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date('2024-01-01'),
        weight_kg: 75,
      });

      await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date('2024-01-15'),
        weight_kg: 76,
      });

      const res = await request(app)
        .get('/api/metrics/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.weight_kg).toBe(76);
    });

    it('should return 404 if no metrics exist', async () => {
      const res = await request(app)
        .get('/api/metrics/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/metrics/trends', () => {
    beforeEach(async () => {
      // Create 90 days of weight data
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * 9);
        await BodyMetrics.create({
          user_id: userId,
          measurement_date: date,
          weight_kg: 75 + i * 0.5,
        });
      }
    });

    it('should calculate weight trends', async () => {
      const res = await request(app)
        .get('/api/metrics/trends?metric_type=weight_kg&days=90')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trend.metric).toBe('weight_kg');
      expect(res.body.trend.data.length).toBeGreaterThan(0);
      expect(res.body.trend.statistics).toHaveProperty('current');
      expect(res.body.trend.statistics).toHaveProperty('change');
      expect(res.body.trend.statistics).toHaveProperty('average');
    });

    it('should require metric_type parameter', async () => {
      const res = await request(app)
        .get('/api/metrics/trends?days=90')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should validate metric_type', async () => {
      const res = await request(app)
        .get('/api/metrics/trends?metric_type=invalid_metric')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/metrics/:id', () => {
    it('should get specific metrics entry', async () => {
      const metrics = await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date(),
        weight_kg: 75,
      });

      const res = await request(app)
        .get(`/api/metrics/${metrics._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.weight_kg).toBe(75);
    });

    it('should return 404 for non-existent metrics', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/metrics/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow access to other users metrics', async () => {
      // Create another user
      const otherUserRes = await request(app).post('/api/auth/signup').send({
        email: 'other@example.com',
        password: 'Test123!',
      });

      const otherMetrics = await BodyMetrics.create({
        user_id: otherUserRes.body.user.id,
        measurement_date: new Date(),
        weight_kg: 80,
      });

      const res = await request(app)
        .get(`/api/metrics/${otherMetrics._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/metrics/:id', () => {
    it('should update metrics entry', async () => {
      const metrics = await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date(),
        weight_kg: 75,
        body_fat_percentage: 18,
      });

      const res = await request(app)
        .patch(`/api/metrics/${metrics._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight_kg: 76,
          notes: 'Updated weight',
        });

      expect(res.status).toBe(200);
      expect(res.body.metrics.weight_kg).toBe(76);
      expect(res.body.metrics.notes).toBe('Updated weight');
      expect(res.body.metrics.body_fat_percentage).toBe(18); // Unchanged
    });

    it('should validate updated values', async () => {
      const metrics = await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date(),
        weight_kg: 75,
      });

      const res = await request(app)
        .patch(`/api/metrics/${metrics._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight_kg: 600, // Invalid
        });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent metrics', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/metrics/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ weight_kg: 76 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/metrics/:id', () => {
    it('should delete metrics entry', async () => {
      const metrics = await BodyMetrics.create({
        user_id: userId,
        measurement_date: new Date(),
        weight_kg: 75,
      });

      const res = await request(app)
        .delete(`/api/metrics/${metrics._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const deleted = await BodyMetrics.findById(metrics._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent metrics', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/metrics/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
