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
import VisionScan from '../models/VisionScan';
import { uploadPhoto } from '../services/storageService';
import { AuthRequest } from '../middleware/auth';

export const createVisionScan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const scan = new VisionScan({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      source: req.body.source,
      image_url: req.body.image_url,
      items: req.body.items || [],
      status: req.body.status || 'pending',
      processed_at: req.body.processed_at ? new Date(req.body.processed_at) : undefined,
    });

    await scan.save();

    res.status(201).json({ scan });
  } catch (error) {
    console.error('Create vision scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadVisionImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const source = req.body.source as 'fridge' | 'grocery' | 'receipt';
    if (!source || !['fridge', 'grocery', 'receipt'].includes(source)) {
      res.status(400).json({ error: 'Invalid source. Use fridge, grocery, or receipt.' });
      return;
    }

    const userId = req.user?.userId as string;
    const photoType = `vision-${source}` as 'vision-fridge' | 'vision-grocery' | 'vision-receipt';

    const { url, filename } = await uploadPhoto(userId, req.file, photoType);

    res.status(201).json({
      image: {
        url,
        filename,
        source,
      },
    });
  } catch (error) {
    console.error('Upload vision image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const getVisionScans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const scans = await VisionScan.find({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    })
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await VisionScan.countDocuments({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    res.json({
      scans,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        has_more: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Get vision scans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVisionScanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scan = await VisionScan.findOne({
      _id: id,
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
    });

    if (!scan) {
      res.status(404).json({ error: 'Vision scan not found' });
      return;
    }

    res.json({ scan });
  } catch (error) {
    console.error('Get vision scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVisionScan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;

    const scan = await VisionScan.findOneAndUpdate(
      {
        _id: id,
        user_id: new mongoose.Types.ObjectId(req.user?.userId),
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!scan) {
      res.status(404).json({ error: 'Vision scan not found' });
      return;
    }

    res.json({ scan });
  } catch (error) {
    console.error('Update vision scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
