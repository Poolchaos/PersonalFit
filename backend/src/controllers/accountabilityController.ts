import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import {
  getOrCreateAccountability,
  getAccountabilitySummary,
  assignPenalty,
  resolvePenalty,
  getCurrentWeekStats,
} from '../services/accountabilityService';
import Accountability from '../models/Accountability';

/**
 * Get accountability summary
 * GET /api/accountability
 */
export const getAccountability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const summary = await getAccountabilitySummary(userId);

    // Format response to match frontend AccountabilityStatus type
    const response = {
      streak: {
        current: summary.streak.current,
        longest: summary.streak.longest,
      },
      totals: summary.totals,
      current_week: {
        week_start: summary.current_week.week_start.toISOString(),
        workouts_planned: summary.current_week.workouts_planned,
        workouts_completed: summary.current_week.workouts_completed,
        workouts_missed: summary.current_week.workouts_missed,
        completion_rate: summary.current_week.completion_rate,
      },
      recent_penalties: summary.recent_penalties,
    };

    res.json(response);
  } catch (error) {
    console.error('Get accountability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get full accountability details
 * GET /api/accountability/details
 */
export const getAccountabilityDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const accountability = await getOrCreateAccountability(userId);

    res.json(accountability);
  } catch (error) {
    console.error('Get accountability details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Assign a penalty
 * POST /api/accountability/penalties
 */
export const createPenalty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { workout_date, severity, description } = req.body;

    const accountability = await assignPenalty(
      userId,
      new Date(workout_date),
      severity,
      description
    );

    res.status(201).json(accountability);
  } catch (error) {
    console.error('Create penalty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Resolve a penalty
 * PATCH /api/accountability/penalties/:penaltyId/resolve
 */
export const resolvePenaltyById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { penaltyId } = req.params;

    const accountability = await resolvePenalty(userId, penaltyId);

    res.json(accountability);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Penalty not found') {
      res.status(404).json({ message: 'Penalty not found' });
      return;
    }
    if (error instanceof Error && error.message === 'Accountability record not found') {
      res.status(404).json({ message: 'Accountability record not found' });
      return;
    }
    console.error('Resolve penalty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get penalties (filtered)
 * GET /api/accountability/penalties
 */
export const getPenalties = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { resolved, severity } = req.query;

    const accountability = await Accountability.findOne({ user_id: userId });

    if (!accountability) {
      res.json({ penalties: [] });
      return;
    }

    let penalties = accountability.penalties;

    // Filter by resolved status
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      penalties = penalties.filter((p) => p.resolved === isResolved);
    }

    // Filter by severity
    if (severity) {
      penalties = penalties.filter((p) => p.severity === severity);
    }

    res.json({ penalties });
  } catch (error) {
    console.error('Get penalties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get weekly statistics
 * GET /api/accountability/weekly-stats
 */
export const getWeeklyStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { limit } = req.query;

    const accountability = await Accountability.findOne({ user_id: userId });

    if (!accountability) {
      res.json({ weekly_stats: [] });
      return;
    }

    // Sort by week_start descending (most recent first)
    const stats = accountability.weekly_stats
      .sort((a, b) => b.week_start.getTime() - a.week_start.getTime())
      .slice(0, limit ? parseInt(limit as string) : undefined);

    res.json({ weekly_stats: stats });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current week statistics
 * GET /api/accountability/current-week
 */
export const getCurrentWeek = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const currentWeek = await getCurrentWeekStats(userId);

    res.json(currentWeek);
  } catch (error) {
    console.error('Get current week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
