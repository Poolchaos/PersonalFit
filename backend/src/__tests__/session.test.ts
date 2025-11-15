import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import WorkoutSession from '../models/WorkoutSession';
import ExerciseLog from '../models/ExerciseLog';
import WorkoutPlan from '../models/WorkoutPlan';

let authToken: string;
let userId: string;
let sessionId: string;
let planId: string;

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
  await WorkoutSession.deleteMany({});
  await ExerciseLog.deleteMany({});
  await WorkoutPlan.deleteMany({});

  // Create test user
  const signupRes = await request(app).post('/api/auth/signup').send({
    email: 'test@example.com',
    password: 'Test123!',
  });
  authToken = signupRes.body.accessToken;
  userId = signupRes.body.user._id;

  // Create test workout plan
  const plan = await WorkoutPlan.create({
    user_id: new mongoose.Types.ObjectId(userId),
    plan_data: {
      program_name: 'Test Program',
      duration_weeks: 4,
      workouts: [],
    },
    generation_context: { equipment: [], fitness_level: 'intermediate' },
    is_active: true,
  });
  planId = (plan._id as mongoose.Types.ObjectId).toString();
});

describe('Workout Session Logging', () => {
  describe('POST /api/sessions', () => {
    it('should create a new workout session', async () => {
      const sessionData = {
        plan_id: planId,
        session_date: new Date().toISOString(),
        completion_status: 'planned',
        planned_duration_minutes: 60,
        exercises_planned: 5,
      };

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData);

      expect(res.status).toBe(201);
      expect(res.body.session).toHaveProperty('_id');
      expect(res.body.session.completion_status).toBe('planned');
      expect(res.body.session.exercises_planned).toBe(5);
      sessionId = res.body.session._id;
    });

    it('should validate session date format', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          session_date: 'invalid-date',
          completion_status: 'planned',
        });

      expect(res.status).toBe(400);
    });

    it('should validate completion status enum', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          session_date: new Date().toISOString(),
          completion_status: 'invalid_status',
        });

      expect(res.status).toBe(400);
    });

    it('should validate mood enums', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          session_date: new Date().toISOString(),
          completion_status: 'planned',
          mood_before: 'invalid_mood',
        });

      expect(res.status).toBe(400);
    });

    it('should validate difficulty range (1-10)', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          session_date: new Date().toISOString(),
          completion_status: 'planned',
          perceived_difficulty: 15,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/sessions', () => {
    it('should list all sessions for user', async () => {
      // Create multiple test sessions
      const sessions = [
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
          planned_duration_minutes: 60,
          actual_duration_minutes: 55,
          perceived_difficulty: 7,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
          planned_duration_minutes: 45,
          actual_duration_minutes: 50,
          perceived_difficulty: 6,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-03'),
          completion_status: 'skipped',
          planned_duration_minutes: 60,
        },
      ];
      await WorkoutSession.insertMany(sessions);


      const res = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter sessions by status', async () => {
      await WorkoutSession.insertMany([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-03'),
          completion_status: 'skipped',
        },
      ]);

      const res = await request(app)
        .get('/api/sessions?status=completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(2);
      expect(res.body.sessions.every((s: { completion_status: string }) => s.completion_status === 'completed')).toBe(true);
    });

    it('should filter sessions by date range', async () => {
      await WorkoutSession.insertMany([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-05'),
          completion_status: 'skipped',
        },
      ]);

      const res = await request(app)
        .get('/api/sessions?from_date=2024-01-01&to_date=2024-01-02')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(2);
    });

    it('should support pagination', async () => {
      await WorkoutSession.insertMany([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-03'),
          completion_status: 'skipped',
        },
      ]);

      const res = await request(app)
        .get('/api/sessions?limit=2&skip=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should get session with exercises', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'completed',
        planned_duration_minutes: 60,
        actual_duration_minutes: 55,
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      // Add exercise logs
      await ExerciseLog.create({
        session_id: new mongoose.Types.ObjectId(sessionId),
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Bench Press',
        exercise_type: 'strength',
        sets_completed: 3,
        target_sets: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 60, completed: true },
          { set_number: 2, reps: 8, weight_kg: 65, completed: true },
          { set_number: 3, reps: 6, weight_kg: 70, completed: true },
        ],
      });


      const res = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.session).toHaveProperty('_id');
      expect(res.body.exercises).toHaveLength(1);
      expect(res.body.exercises[0].exercise_name).toBe('Bench Press');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/sessions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/sessions/:id', () => {
    it('should update session status to completed', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
        planned_duration_minutes: 60,
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completion_status: 'completed',
          actual_duration_minutes: 55,
          mood_after: 'accomplished',
          perceived_difficulty: 7,
        });

      expect(res.status).toBe(200);
      expect(res.body.session.completion_status).toBe('completed');
      expect(res.body.session.actual_duration_minutes).toBe(55);
      expect(res.body.session.mood_after).toBe('accomplished');
    });

    it('should not allow updating other users sessions', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const otherUser = await request(app).post('/api/auth/signup').send({
        email: 'other@example.com',
        password: 'Test123!',
      });

      const res = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({ completion_status: 'completed' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should delete session and cascade delete exercises', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'planned',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      await ExerciseLog.create({
        session_id: new mongoose.Types.ObjectId(sessionId),
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Squat',
        exercise_type: 'strength',
        sets_completed: 3,
      });

      const res = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const deletedSession = await WorkoutSession.findById(sessionId);
      expect(deletedSession).toBeNull();

      const exercises = await ExerciseLog.find({
        session_id: new mongoose.Types.ObjectId(sessionId),
      });
      expect(exercises).toHaveLength(0);
    });
  });
});

describe('Exercise Logging', () => {
  describe('POST /api/sessions/:id/exercises', () => {
    it('should log exercise and update session stats', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
        planned_duration_minutes: 60,
        exercises_planned: 5,
        exercises_completed: 0,
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const exerciseData = {
        exercise_name: 'Deadlift',
        exercise_type: 'strength',
        sets_completed: 3,
        target_sets: 3,
        set_details: [
          {
            set_number: 1,
            reps: 8,
            target_reps: 8,
            weight_kg: 100,
            completed: true,
            form_rating: 4,
          },
          {
            set_number: 2,
            reps: 8,
            target_reps: 8,
            weight_kg: 100,
            completed: true,
            form_rating: 5,
          },
          {
            set_number: 3,
            reps: 7,
            target_reps: 8,
            weight_kg: 100,
            completed: true,
            form_rating: 4,
          },
        ],
        target_muscles: ['hamstrings', 'glutes', 'lower_back'],
        difficulty_rating: 8,
      };

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exerciseData);

      expect(res.status).toBe(201);
      expect(res.body.exercise).toHaveProperty('_id');
      expect(res.body.exercise.exercise_name).toBe('Deadlift');
      expect(res.body.exercise.total_volume_kg).toBe(2300); // 3 sets * 8 reps avg * 100kg

      // Verify session was updated
      const updatedSession = await WorkoutSession.findById(sessionId);
      expect(updatedSession?.exercises_completed).toBe(1);
      expect(updatedSession?.completion_percentage).toBeGreaterThan(0);
    });

    it('should validate exercise type enum', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exercise_name: 'Test',
          exercise_type: 'invalid_type',
          sets_completed: 3,
        });

      expect(res.status).toBe(400);
    });

    it('should validate form rating range (1-5)', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exercise_name: 'Test',
          exercise_type: 'strength',
          sets_completed: 1,
          set_details: [{ set_number: 1, form_rating: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('should validate difficulty rating range (1-10)', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exercise_name: 'Test',
          exercise_type: 'strength',
          sets_completed: 1,
          difficulty_rating: 15,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/sessions/:id/exercises/:exerciseId', () => {
    it('should update exercise log', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const exercise = await ExerciseLog.create({
        session_id: new mongoose.Types.ObjectId(sessionId),
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Squat',
        exercise_type: 'strength',
        sets_completed: 3,
        target_sets: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 80, completed: true },
          { set_number: 2, reps: 10, weight_kg: 80, completed: true },
          { set_number: 3, reps: 8, weight_kg: 80, completed: true },
        ],
      });
      const exerciseId = (exercise._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .put(`/api/sessions/${sessionId}/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          set_details: [
            { set_number: 1, reps: 10, weight_kg: 80, completed: true, form_rating: 5 },
            { set_number: 2, reps: 10, weight_kg: 80, completed: true, form_rating: 5 },
            { set_number: 3, reps: 10, weight_kg: 80, completed: true, form_rating: 4 },
          ],
          difficulty_rating: 7,
        });

      expect(res.status).toBe(200);
      expect(res.body.exercise.set_details[2].reps).toBe(10); // Updated from 8
      expect(res.body.exercise.difficulty_rating).toBe(7);
    });

    it('should recalculate volume on update', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const exercise = await ExerciseLog.create({
        session_id: new mongoose.Types.ObjectId(sessionId),
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Squat',
        exercise_type: 'strength',
        sets_completed: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 80, completed: true },
        ],
      });
      const exerciseId = (exercise._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .put(`/api/sessions/${sessionId}/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          set_details: [
            { set_number: 1, reps: 12, weight_kg: 100, completed: true },
            { set_number: 2, reps: 12, weight_kg: 100, completed: true },
            { set_number: 3, reps: 12, weight_kg: 100, completed: true },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.exercise.total_volume_kg).toBe(3600); // 3 sets * 12 reps * 100kg
    });
  });
});

describe('Progress Tracking', () => {
  describe('GET /api/progress', () => {
    it('should return comprehensive progress stats', async () => {
      // Create workout history
      const sessions = [
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
          actual_duration_minutes: 60,
          perceived_difficulty: 7,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
          actual_duration_minutes: 55,
          perceived_difficulty: 6,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-03'),
          completion_status: 'completed',
          actual_duration_minutes: 50,
          perceived_difficulty: 5,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-05'),
          completion_status: 'skipped',
        },
      ];
      const createdSessions = await WorkoutSession.insertMany(sessions);

      // Create exercise logs
      await ExerciseLog.create({
        session_id: createdSessions[0]._id,
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Bench Press',
        exercise_type: 'strength',
        sets_completed: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 60, completed: true },
          { set_number: 2, reps: 10, weight_kg: 60, completed: true },
          { set_number: 3, reps: 10, weight_kg: 60, completed: true },
        ],
        personal_record: true,
      });

      await ExerciseLog.create({
        session_id: createdSessions[1]._id,
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Bench Press',
        exercise_type: 'strength',
        sets_completed: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 65, completed: true },
          { set_number: 2, reps: 10, weight_kg: 65, completed: true },
          { set_number: 3, reps: 8, weight_kg: 65, completed: true },
        ],
        personal_record: true,
      });


      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overall');
      expect(res.body).toHaveProperty('recent_performance');
      expect(res.body).toHaveProperty('personal_records');
      expect(res.body).toHaveProperty('exercise_history');
    });

    it('should calculate completion rate correctly', async () => {
      const sessions = [
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
          actual_duration_minutes: 60,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
          actual_duration_minutes: 55,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-03'),
          completion_status: 'completed',
          actual_duration_minutes: 50,
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-05'),
          completion_status: 'skipped',
        },
      ];
      await WorkoutSession.insertMany(sessions);

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overall.total_sessions).toBe(4);
      expect(res.body.overall.completed_sessions).toBe(3);
      expect(res.body.overall.completion_rate).toBe(75.0);
    });

    it('should track personal records', async () => {
      const sessions = await WorkoutSession.insertMany([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
        },
      ]);

      await ExerciseLog.create({
        session_id: sessions[0]._id,
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Bench Press',
        exercise_type: 'strength',
        sets_completed: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 65, completed: true },
        ],
        personal_record: true,
      });

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.personal_records.length).toBeGreaterThan(0);
      const benchPress = res.body.personal_records.find(
        (pr: { exercise_name: string }) => pr.exercise_name === 'Bench Press'
      );
      expect(benchPress).toBeDefined();
      expect(benchPress.max_weight_kg).toBe(65);
    });

    it('should calculate total volume', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date('2024-01-01'),
        completion_status: 'completed',
      });

      await ExerciseLog.create({
        session_id: session._id,
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Squat',
        exercise_type: 'strength',
        sets_completed: 3,
        set_details: [
          { set_number: 1, reps: 10, weight_kg: 100, completed: true },
        ],
      });

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overall.total_volume_kg).toBeGreaterThan(0);
    });

    it('should track exercise history', async () => {
      const sessions = await WorkoutSession.insertMany([
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-01'),
          completion_status: 'completed',
        },
        {
          user_id: new mongoose.Types.ObjectId(userId),
          session_date: new Date('2024-01-02'),
          completion_status: 'completed',
        },
      ]);

      await ExerciseLog.insertMany([
        {
          session_id: sessions[0]._id,
          user_id: new mongoose.Types.ObjectId(userId),
          exercise_name: 'Bench Press',
          exercise_type: 'strength',
          sets_completed: 3,
          set_details: [{ set_number: 1, reps: 10, weight_kg: 60, completed: true }],
        },
        {
          session_id: sessions[1]._id,
          user_id: new mongoose.Types.ObjectId(userId),
          exercise_name: 'Bench Press',
          exercise_type: 'strength',
          sets_completed: 3,
          set_details: [{ set_number: 1, reps: 10, weight_kg: 65, completed: true }],
        },
      ]);

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.exercise_history.length).toBeGreaterThan(0);
      const benchPress = res.body.exercise_history.find(
        (ex: { exercise_name: string }) => ex.exercise_name === 'Bench Press'
      );
      expect(benchPress).toBeDefined();
      expect(benchPress.total_sessions).toBe(2);
    });
  });

  describe('HIIT Exercise Logging', () => {
    it('should log HIIT exercise with interval structure', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
        planned_duration_minutes: 30,
        exercises_planned: 4,
        exercises_completed: 0,
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const hiitExerciseData = {
        exercise_name: 'Burpees',
        exercise_type: 'hiit',
        interval_structure: {
          work_seconds: 30,
          rest_seconds: 15,
          rounds: 4,
          rounds_completed: 4,
        },
        target_muscles: ['full_body'],
        difficulty_rating: 8,
      };

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(hiitExerciseData);

      expect(res.status).toBe(201);
      expect(res.body.exercise).toHaveProperty('_id');
      expect(res.body.exercise.exercise_name).toBe('Burpees');
      expect(res.body.exercise.exercise_type).toBe('hiit');
      expect(res.body.exercise.interval_structure.work_seconds).toBe(30);
      expect(res.body.exercise.interval_structure.rest_seconds).toBe(15);
      expect(res.body.exercise.interval_structure.rounds).toBe(4);
      expect(res.body.exercise.total_duration_seconds).toBe(180); // (30 + 15) * 4

      // Verify session was updated
      const updatedSession = await WorkoutSession.findById(sessionId);
      expect(updatedSession?.exercises_completed).toBe(1);
    });

    it('should accept HIIT exercise without sets_completed or set_details', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const hiitExerciseData = {
        exercise_name: 'Mountain Climbers',
        exercise_type: 'hiit',
        interval_structure: {
          work_seconds: 40,
          rest_seconds: 20,
          rounds: 3,
          rounds_completed: 3,
        },
        target_muscles: ['core', 'shoulders'],
      };

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(hiitExerciseData);

      expect(res.status).toBe(201);
      expect(res.body.exercise.sets_completed).toBeUndefined();
      expect(res.body.exercise.set_details).toBeUndefined();
      expect(res.body.exercise.total_duration_seconds).toBe(180); // (40 + 20) * 3
    });

    it('should validate interval_structure work_seconds minimum', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const res = await request(app)
        .post(`/api/sessions/${sessionId}/exercises`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          exercise_name: 'Test HIIT',
          exercise_type: 'hiit',
          interval_structure: {
            work_seconds: 0,
            rest_seconds: 10,
            rounds: 3,
          },
          target_muscles: ['legs'],
        });

      expect(res.status).toBe(400);
    });

    it('should update HIIT exercise with new interval data', async () => {
      const session = await WorkoutSession.create({
        user_id: new mongoose.Types.ObjectId(userId),
        session_date: new Date(),
        completion_status: 'in_progress',
      });
      sessionId = (session._id as mongoose.Types.ObjectId).toString();

      const exercise = await ExerciseLog.create({
        session_id: new mongoose.Types.ObjectId(sessionId),
        user_id: new mongoose.Types.ObjectId(userId),
        exercise_name: 'Jump Squats',
        exercise_type: 'hiit',
        interval_structure: {
          work_seconds: 30,
          rest_seconds: 15,
          rounds: 3,
          rounds_completed: 2,
        },
        target_muscles: ['legs'],
      });

      const exerciseId = (exercise._id as mongoose.Types.ObjectId).toString();

      const updateData = {
        interval_structure: {
          work_seconds: 30,
          rest_seconds: 15,
          rounds: 3,
          rounds_completed: 3,
        },
        difficulty_rating: 7,
      };

      const res = await request(app)
        .put(`/api/sessions/${sessionId}/exercises/${exerciseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.exercise.interval_structure.rounds_completed).toBe(3);
      expect(res.body.exercise.total_duration_seconds).toBe(135); // (30 + 15) * 3
      expect(res.body.exercise.difficulty_rating).toBe(7);
    });
  });
});
