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
import HealthScore from '../models/HealthScore';
import { AuthRequest } from '../middleware/auth';

export const upsertHealthScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { score_date, total_score, pillars, reasons } = req.body;

    const score = await HealthScore.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(req.user?.userId),
        score_date: new Date(score_date),
      },
      {
        $set: {
          total_score,
          pillars,
          reasons: reasons || [],
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ score });
  } catch (error) {
    console.error('Upsert health score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHealthScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date, limit = 30, skip = 0 } = req.query;

    const filter: Record<string, unknown> = {
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    };

    if (from_date || to_date) {
      filter.score_date = {};
      if (from_date) {
        (filter.score_date as Record<string, unknown>).$gte = new Date(from_date as string);
      }
      if (to_date) {
        (filter.score_date as Record<string, unknown>).$lte = new Date(to_date as string);
      }
    }

    const scores = await HealthScore.find(filter)
      .sort({ score_date: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await HealthScore.countDocuments(filter);

    res.json({
      scores,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get health scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
