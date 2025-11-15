import { Response } from 'express';
import { validationResult } from 'express-validator';
import WorkoutSession from '../models/WorkoutSession';
import ExerciseLog from '../models/ExerciseLog';
import { AuthRequest } from '../middleware/auth';

export const createSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const session = new WorkoutSession({
      user_id: req.user?.userId,
      ...req.body,
    });

    await session.save();

    res.status(201).json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, from_date, to_date, plan_id, limit = 50, skip = 0 } = req.query;

    const filter: Record<string, unknown> = { user_id: req.user?.userId };

    if (status) {
      filter.completion_status = status;
    }

    if (plan_id) {
      filter.plan_id = plan_id;
    }

    if (from_date || to_date) {
      filter.session_date = {};
      if (from_date) {
        (filter.session_date as Record<string, unknown>).$gte = new Date(from_date as string);
      }
      if (to_date) {
        (filter.session_date as Record<string, unknown>).$lte = new Date(to_date as string);
      }
    }

    const sessions = await WorkoutSession.find(filter)
      .sort({ session_date: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate('plan_id', 'plan_data.plan_overview');

    const total = await WorkoutSession.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    }).populate('plan_id');

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get exercise logs for this session
    const exercises = await ExerciseLog.find({
      session_id: req.params.id,
    }).sort({ created_at: 1 });

    res.json({
      session,
      exercises,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Update allowed fields
    Object.assign(session, req.body);
    await session.save();

    res.json({ session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const session = await WorkoutSession.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Delete associated exercise logs
    await ExerciseLog.deleteMany({ session_id: req.params.id });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logExercise = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Verify session exists and belongs to user
    const session = await WorkoutSession.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const exerciseLog = new ExerciseLog({
      session_id: req.params.id,
      user_id: req.user?.userId,
      ...req.body,
    });

    await exerciseLog.save();

    // Update session statistics
    const completedExercises = await ExerciseLog.countDocuments({
      session_id: req.params.id,
    });
    session.exercises_completed = completedExercises;

    if (session.exercises_planned) {
      session.completion_percentage = Math.round(
        (completedExercises / session.exercises_planned) * 100
      );
    }

    await session.save();

    res.status(201).json({ exercise: exerciseLog });
  } catch (error) {
    console.error('Log exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExercise = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const exercise = await ExerciseLog.findOne({
      _id: req.params.exerciseId,
      session_id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!exercise) {
      res.status(404).json({ error: 'Exercise log not found' });
      return;
    }

    Object.assign(exercise, req.body);
    await exercise.save();

    res.json({ exercise });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
