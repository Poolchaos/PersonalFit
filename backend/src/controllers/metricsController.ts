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
import BodyMetrics from '../models/BodyMetrics';
import { AuthRequest } from '../middleware/auth';

export const createMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const metrics = new BodyMetrics({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      ...req.body,
    });

    await metrics.save();

    res.status(201).json({ metrics });
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      res.status(409).json({
        error: 'Metrics already exist for this date. Use update endpoint instead.'
      });
      return;
    }
    console.error('Create metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { from_date, to_date, limit = 100, skip = 0 } = req.query;

    const filter: Record<string, unknown> = {
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    };

    if (from_date || to_date) {
      filter.measurement_date = {};
      if (from_date) {
        (filter.measurement_date as Record<string, unknown>).$gte = new Date(
          from_date as string
        );
      }
      if (to_date) {
        (filter.measurement_date as Record<string, unknown>).$lte = new Date(
          to_date as string
        );
      }
    }

    const metrics = await BodyMetrics.find(filter)
      .sort({ measurement_date: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await BodyMetrics.countDocuments(filter);

    res.json({
      metrics,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMetricsById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const metrics = await BodyMetrics.findOne({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!metrics) {
      res.status(404).json({ error: 'Metrics not found' });
      return;
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Get metrics by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;

    const metrics = await BodyMetrics.findOneAndUpdate(
      {
        _id: id,
        user_id: new mongoose.Types.ObjectId(req.user?.userId),
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!metrics) {
      res.status(404).json({ error: 'Metrics not found' });
      return;
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Update metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const metrics = await BodyMetrics.findOneAndDelete({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!metrics) {
      res.status(404).json({ error: 'Metrics not found' });
      return;
    }

    res.json({ message: 'Metrics deleted successfully' });
  } catch (error) {
    console.error('Delete metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLatestMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const metrics = await BodyMetrics.findOne({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    })
      .sort({ measurement_date: -1 })
      .limit(1);

    if (!metrics) {
      res.status(404).json({ error: 'No metrics found' });
      return;
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Get latest metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMetricsTrends = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { metric_type, days = 90 } = req.query;

    if (!metric_type || typeof metric_type !== 'string') {
      res.status(400).json({ error: 'metric_type is required' });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const metrics = await BodyMetrics.find({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      measurement_date: { $gte: startDate },
      [metric_type]: { $exists: true, $ne: null },
    })
      .select(`measurement_date ${metric_type}`)
      .sort({ measurement_date: 1 });

    // Calculate trend statistics
    const values = metrics.map((m) => {
      const value = m.get(metric_type);
      return typeof value === 'number' ? value : null;
    }).filter((v): v is number => v !== null);

    const trend = {
      metric: metric_type,
      data: metrics.map((m) => ({
        date: m.measurement_date,
        value: m.get(metric_type),
      })),
      statistics: {
        current: values[values.length - 1] || null,
        starting: values[0] || null,
        change: values.length >= 2 ? values[values.length - 1] - values[0] : 0,
        change_percentage:
          values.length >= 2 && values[0] !== 0
            ? ((values[values.length - 1] - values[0]) / values[0]) * 100
            : 0,
        average: values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
        min: values.length > 0 ? Math.min(...values) : null,
        max: values.length > 0 ? Math.max(...values) : null,
      },
    };

    res.json({ trend });
  } catch (error) {
    console.error('Get metrics trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
