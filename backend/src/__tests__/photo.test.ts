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
import BodyMetrics from '../models/BodyMetrics';
import * as storageService from '../services/storageService';

// Mock the storage service
jest.mock('../services/storageService');

describe('Photo Upload API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await BodyMetrics.deleteMany({});

    // Create test user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'photo@test.com',
        password: 'Test1234!',
        name: 'Photo Test'
      });

    authToken = signupRes.body.accessToken;
    userId = signupRes.body.user.id;

    // Mock storage service methods
    (storageService.validateFile as jest.Mock).mockReturnValue({ valid: true });
    (storageService.uploadPhoto as jest.Mock).mockResolvedValue({
      url: 'http://localhost:9000/progress-photos/test-photo.jpg',
      filename: `${userId}/front/123456789.jpg`
    });
    (storageService.deletePhoto as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/photos/upload', () => {
    it('should upload a photo successfully', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Photo uploaded successfully');
      expect(res.body.photo.url).toBe('http://localhost:9000/progress-photos/test-photo.jpg');
      expect(storageService.uploadPhoto).toHaveBeenCalled();
    });

    it('should upload photo and link to body metrics', async () => {
      const measurementDate = new Date().toISOString();

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .field('measurement_date', measurementDate)
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Photo uploaded successfully');
      expect(res.body.photo.url).toBe('http://localhost:9000/progress-photos/test-photo.jpg');

      // Verify body metrics was updated
      const metrics = await BodyMetrics.findOne({
        user_id: new mongoose.Types.ObjectId(userId),
        measurement_date: new Date(measurementDate)
      });

      expect(metrics).toBeTruthy();
      expect(metrics?.progress_photos?.front_url).toBe('http://localhost:9000/progress-photos/test-photo.jpg');
    });

    it('should reject upload without authentication', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .field('photo_type', 'front')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject upload without file', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No file uploaded');
    });

    it('should reject upload without photo_type', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid photo_type. Must be: front, side, or back');
    });

    it('should reject invalid photo_type', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'invalid')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid photo_type. Must be: front, side, or back');
    });

    it('should reject invalid file type', async () => {
      (storageService.validateFile as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Invalid file type'
      });

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy(); // Multer will reject the file
    });

    it('should reject file that is too large', async () => {
      (storageService.validateFile as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File size exceeds 10MB limit'
      });

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .attach('photo', Buffer.alloc(11 * 1024 * 1024), {
          filename: 'large.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy(); // Multer will reject the file size
    });

    it('should handle storage upload error', async () => {
      (storageService.uploadPhoto as jest.Mock).mockRejectedValue(new Error('MinIO connection failed'));

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to upload photo');
    });

    it('should handle side photo upload', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'side')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'side.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Photo uploaded successfully');
    });

    it('should handle back photo upload', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'back')
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'back.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Photo uploaded successfully');
    });

    it('should create body metrics if linking with measurement_date', async () => {
      const measurementDate = new Date().toISOString();

      // Verify no metrics exist initially
      let metrics = await BodyMetrics.findOne({
        user_id: new mongoose.Types.ObjectId(userId)
      });
      expect(metrics).toBeNull();

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'front')
        .field('measurement_date', measurementDate)
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);

      // Verify metrics was created
      metrics = await BodyMetrics.findOne({
        user_id: new mongoose.Types.ObjectId(userId)
      });
      expect(metrics).toBeTruthy();
      expect(metrics?.progress_photos?.front_url).toBe('http://localhost:9000/progress-photos/test-photo.jpg');
    });

    it('should update existing body metrics with photo', async () => {
      const measurementDate = new Date();

      // Create existing metrics
      await BodyMetrics.create({
        user_id: new mongoose.Types.ObjectId(userId),
        measurement_date: measurementDate,
        weight_kg: 75,
        progress_photos: {}
      });

      const res = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('photo_type', 'side')
        .field('measurement_date', measurementDate.toISOString())
        .attach('photo', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(201);

      // Verify metrics was updated, not duplicated
      const metricsCount = await BodyMetrics.countDocuments({
        user_id: new mongoose.Types.ObjectId(userId)
      });
      expect(metricsCount).toBe(1);

      const metrics = await BodyMetrics.findOne({
        user_id: new mongoose.Types.ObjectId(userId)
      });
      expect(metrics?.progress_photos?.side_url).toBe('http://localhost:9000/progress-photos/test-photo.jpg');
      expect(metrics?.weight_kg).toBe(75); // Original data preserved
    });
  });

  describe('DELETE /api/photos/:userId/:photoType/:timestamp', () => {
    it('should delete a photo successfully', async () => {
      const filename = `${userId}/front/123456789.jpg`;

      const res = await request(app)
        .delete(`/api/photos/${filename}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Photo deleted successfully');
      expect(storageService.deletePhoto).toHaveBeenCalledWith(filename);
    });

    it('should reject deletion without authentication', async () => {
      const filename = `${userId}/front/123456789.jpg`;

      const res = await request(app)
        .delete(`/api/photos/${filename}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject deletion of another user\'s photo', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const filename = `${otherUserId}/front/123456789.jpg`;

      const res = await request(app)
        .delete(`/api/photos/${filename}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Unauthorized to delete this photo');
      expect(storageService.deletePhoto).not.toHaveBeenCalled();
    });

    it('should handle storage deletion error', async () => {
      const filename = `${userId}/front/123456789.jpg`;
      (storageService.deletePhoto as jest.Mock).mockRejectedValue(new Error('MinIO error'));

      const res = await request(app)
        .delete(`/api/photos/${filename}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete photo');
    });
  });

  describe('GET /api/photos', () => {
    it('should get user photos successfully', async () => {
      // Create some metrics with photos
      const measurementDate = new Date();
      await BodyMetrics.create({
        user_id: new mongoose.Types.ObjectId(userId),
        measurement_date: measurementDate,
        progress_photos: {
          front_url: 'http://localhost:9000/progress-photos/front.jpg',
        },
      });

      const res = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.photos).toHaveLength(1);
      expect(res.body.photos[0].progress_photos.front_url).toBe('http://localhost:9000/progress-photos/front.jpg');
    });

    it('should return empty array if no photos', async () => {
      const res = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.photos).toEqual([]);
    });

    it('should reject request without authentication', async () => {
      const res = await request(app)
        .get('/api/photos');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should handle storage listing error', async () => {
      // Force an error by mocking BodyMetrics.find to throw
      jest.spyOn(BodyMetrics, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBeTruthy();
    });
  });
});
