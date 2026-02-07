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
import HabitLog from '../models/HabitLog';
import { AuthRequest } from '../middleware/auth';

export const upsertHabitLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { log_date, entries } = req.body;

    const habitLog = await HabitLog.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(req.user?.userId),
        log_date: new Date(log_date),
      },
      {
        $set: {
          entries,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ habitLog });
  } catch (error) {
    console.error('Upsert habit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHabitLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date, limit = 30, skip = 0 } = req.query;

    const filter: Record<string, unknown> = {
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    };

    if (from_date || to_date) {
      filter.log_date = {};
      if (from_date) {
        (filter.log_date as Record<string, unknown>).$gte = new Date(from_date as string);
      }
      if (to_date) {
        (filter.log_date as Record<string, unknown>).$lte = new Date(to_date as string);
      }
    }

    const logs = await HabitLog.find(filter)
      .sort({ log_date: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await HabitLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get habit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHabitLogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await HabitLog.findOne({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!log) {
      res.status(404).json({ error: 'Habit log not found' });
      return;
    }

    res.json({ habitLog: log });
  } catch (error) {
    console.error('Get habit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHabitLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await HabitLog.findOneAndDelete({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!log) {
      res.status(404).json({ error: 'Habit log not found' });
      return;
    }

    res.json({ message: 'Habit log deleted successfully' });
  } catch (error) {
    console.error('Delete habit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
