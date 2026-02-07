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

import { Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Goal from '../models/Goal';

/**
 * Get all goals for the authenticated user
 * GET /api/goals
 */
export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { status, category } = req.query;

    const filter: { user_id: mongoose.Types.ObjectId; status?: string; category?: string } = { user_id: userId };
    if (status) filter.status = status as string;
    if (category) filter.category = category as string;

    const goals = await Goal.find(filter).sort({ created_at: -1 });

    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single goal by ID
 * GET /api/goals/:id
 */
export const getGoalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { id } = req.params;

    const goal = await Goal.findOne({
      _id: id,
      user_id: userId,
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new goal
 * POST /api/goals
 */
export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const {
      name,
      description,
      type,
      category,
      initial_value,
      current_value,
      target_value,
      unit,
      target_date,
    } = req.body;

    const goal = new Goal({
      user_id: userId,
      name,
      description,
      type,
      category,
      initial_value,
      current_value: current_value ?? initial_value, // Default to initial if not provided
      target_value,
      unit,
      target_date,
      status: 'active',
    });

    await goal.save();

    res.status(201).json({ goal });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a goal
 * PUT /api/goals/:id
 */
export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating user_id, created_at
    delete updates.user_id;
    delete updates.created_at;

    const goal = await Goal.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    res.json({ goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update goal current value (primary update endpoint)
 * PATCH /api/goals/:id/progress
 */
export const updateGoalProgress = async (
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
    const { id } = req.params;
    const { current_value } = req.body;

    const goal = await Goal.findOne({ _id: id, user_id: userId });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    goal.current_value = current_value;
    await goal.save(); // Pre-save hook will calculate progress

    res.json({ goal });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update goal status
 * PATCH /api/goals/:id/status
 */
export const updateGoalStatus = async (
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
    const { id } = req.params;
    const { status } = req.body;

    const goal = await Goal.findOne({ _id: id, user_id: userId });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    goal.status = status;
    if (status === 'completed' && !goal.completed_date) {
      goal.completed_date = new Date();
    }
    await goal.save();

    res.json({ goal });
  } catch (error) {
    console.error('Update goal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a goal
 * DELETE /api/goals/:id
 */
export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    if (!goal) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get goal statistics
 * GET /api/goals/stats
 */
export const getGoalStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);

    const [stats] = await Goal.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          abandoned: {
            $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] },
          },
          paused: {
            $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] },
          },
          average_progress: { $avg: '$progress_percentage' },
        },
      },
    ]);

    res.json({
      stats: stats || {
        total: 0,
        active: 0,
        completed: 0,
        abandoned: 0,
        paused: 0,
        average_progress: 0,
      },
    });
  } catch (error) {
    console.error('Get goal stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
