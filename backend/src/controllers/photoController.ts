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
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { uploadPhoto, deletePhoto } from '../services/storageService';
import BodyMetrics from '../models/BodyMetrics';

/**
 * Upload progress photo
 * POST /api/photos/upload
 */
export const uploadProgressPhoto = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { photo_type, measurement_date } = req.body;

    if (!photo_type || !['front', 'side', 'back'].includes(photo_type)) {
      res.status(400).json({
        error: 'Invalid photo_type. Must be: front, side, or back',
      });
      return;
    }

    const userId = req.user?.userId as string;

    // Upload to MinIO
    const { url, filename } = await uploadPhoto(userId, req.file, photo_type);

    // If measurement_date provided, attach to existing or create new metrics
    if (measurement_date) {
      const date = new Date(measurement_date);
      let metrics = await BodyMetrics.findOne({
        user_id: new mongoose.Types.ObjectId(userId),
        measurement_date: date,
      });

      // Create new metrics if doesn't exist
      if (!metrics) {
        metrics = new BodyMetrics({
          user_id: new mongoose.Types.ObjectId(userId),
          measurement_date: date,
          progress_photos: {},
        });
      }

      // Update the progress photos for this metrics entry
      if (!metrics.progress_photos) {
        metrics.progress_photos = {};
      }
      if (photo_type === 'front') {
        metrics.progress_photos.front_url = url;
      } else if (photo_type === 'side') {
        metrics.progress_photos.side_url = url;
      } else if (photo_type === 'back') {
        metrics.progress_photos.back_url = url;
      }
      await metrics.save();
    }

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        url,
        filename,
        type: photo_type,
      },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      error: 'Failed to upload photo',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete progress photo
 * DELETE /api/photos/:userId/:photoType/:timestamp
 */
export const deleteProgressPhoto = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId: filenameUserId, photoType, timestamp } = req.params;
    const userId = req.user?.userId as string;

    // Reconstruct filename from path params
    const filename = `${filenameUserId}/${photoType}/${timestamp}`;

    if (!filename) {
      res.status(400).json({ message: 'Filename is required' });
      return;
    }

    // Verify the photo belongs to the user
    if (!filename.startsWith(userId)) {
      res.status(403).json({ error: 'Unauthorized to delete this photo' });
      return;
    }

    await deletePhoto(filename);

    // Remove from any associated metrics
    await BodyMetrics.updateMany(
      { user_id: new mongoose.Types.ObjectId(userId) },
      {
        $unset: {
          'progress_photos.front_url': filename,
          'progress_photos.side_url': filename,
          'progress_photos.back_url': filename,
        },
      }
    );

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

/**
 * Get user's progress photos
 * GET /api/photos
 */
export const getUserPhotos = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId as string;

    // Get all metrics with photos
    const metrics = await BodyMetrics.find({
      user_id: new mongoose.Types.ObjectId(userId),
      progress_photos: { $exists: true, $ne: {} },
    })
      .select('measurement_date progress_photos')
      .sort({ measurement_date: -1 });

    res.json({ photos: metrics });
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
};
