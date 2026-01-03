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
import Equipment from '../models/Equipment';

describe('Equipment API', () => {
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
    await Equipment.deleteMany({});

    // Create a test user and get token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    authToken = signupResponse.body.accessToken;
  });

  describe('POST /api/equipment', () => {
    it('should create new equipment', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_name: 'Adjustable Dumbbells',
          equipment_type: 'free_weights',
          quantity: 2,
          specifications: {
            adjustable: true,
            min_weight_kg: 5,
            max_weight_kg: 25,
          },
          condition: 'new',
        });

      expect(response.status).toBe(201);
      expect(response.body.equipment.equipment_name).toBe('Adjustable Dumbbells');
      expect(response.body.equipment.equipment_type).toBe('free_weights');
      expect(response.body.equipment.quantity).toBe(2);
    });

    it('should validate equipment_type enum', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_name: 'Test Equipment',
          equipment_type: 'invalid_type',
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .send({
          equipment_name: 'Test',
          equipment_type: 'free_weights',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/equipment', () => {
    beforeEach(async () => {
      const userId = (await User.findOne({ email: 'test@example.com' }))?._id;

      await Equipment.create([
        {
          user_id: userId,
          equipment_name: 'Dumbbells',
          equipment_type: 'free_weights',
          is_available: true,
        },
        {
          user_id: userId,
          equipment_name: 'Treadmill',
          equipment_type: 'cardio',
          is_available: false,
        },
      ]);
    });

    it('should get all equipment for user', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.equipment).toHaveLength(2);
    });

    it('should filter by equipment type', async () => {
      const response = await request(app)
        .get('/api/equipment?type=cardio')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.equipment).toHaveLength(1);
      expect(response.body.equipment[0].equipment_type).toBe('cardio');
    });

    it('should filter by availability', async () => {
      const response = await request(app)
        .get('/api/equipment?available=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.equipment).toHaveLength(1);
      expect(response.body.equipment[0].equipment_name).toBe('Dumbbells');
    });
  });

  describe('PUT /api/equipment/:id', () => {
    let equipmentId: string;

    beforeEach(async () => {
      const userId = (await User.findOne({ email: 'test@example.com' }))?._id;
      const equipment = await Equipment.create({
        user_id: userId,
        equipment_name: 'Old Name',
        equipment_type: 'free_weights',
      });
      equipmentId = (equipment._id as string).toString();
    });

    it('should update equipment', async () => {
      const response = await request(app)
        .put(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_name: 'New Name',
          condition: 'good',
        });

      expect(response.status).toBe(200);
      expect(response.body.equipment.equipment_name).toBe('New Name');
      expect(response.body.equipment.condition).toBe('good');
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/equipment/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ equipment_name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    let equipmentId: string;

    beforeEach(async () => {
      const userId = (await User.findOne({ email: 'test@example.com' }))?._id;
      const equipment = await Equipment.create({
        user_id: userId,
        equipment_name: 'To Delete',
        equipment_type: 'free_weights',
      });
      equipmentId = (equipment._id as string).toString();
    });

    it('should delete equipment', async () => {
      const response = await request(app)
        .delete(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Equipment deleted successfully');

      const equipment = await Equipment.findById(equipmentId);
      expect(equipment).toBeNull();
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/equipment/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
