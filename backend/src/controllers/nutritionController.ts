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
import NutritionEvent from '../models/NutritionEvent';
import { AuthRequest } from '../middleware/auth';

export const createNutritionEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const event = new NutritionEvent({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      source: req.body.source,
      meal_title: req.body.meal_title,
      consumed_at: new Date(req.body.consumed_at),
      calories: req.body.calories,
      macros: req.body.macros,
      items: req.body.items || [],
    });

    await event.save();

    res.status(201).json({ event });
  } catch (error) {
    console.error('Create nutrition event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNutritionEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from_date, to_date, limit = 50, skip = 0 } = req.query;

    const filter: Record<string, unknown> = {
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    };

    if (from_date || to_date) {
      filter.consumed_at = {};
      if (from_date) {
        (filter.consumed_at as Record<string, unknown>).$gte = new Date(from_date as string);
      }
      if (to_date) {
        (filter.consumed_at as Record<string, unknown>).$lte = new Date(to_date as string);
      }
    }

    const events = await NutritionEvent.find(filter)
      .sort({ consumed_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await NutritionEvent.countDocuments(filter);

    res.json({
      events,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get nutrition events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNutritionEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await NutritionEvent.findOne({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!event) {
      res.status(404).json({ error: 'Nutrition event not found' });
      return;
    }

    res.json({ event });
  } catch (error) {
    console.error('Get nutrition event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNutritionEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await NutritionEvent.findOneAndDelete({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!event) {
      res.status(404).json({ error: 'Nutrition event not found' });
      return;
    }

    res.json({ message: 'Nutrition event deleted successfully' });
  } catch (error) {
    console.error('Delete nutrition event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
