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
import { AuthRequest } from '../middleware/auth';
import * as medicationService from '../services/medicationService';

/**
 * Get all medications for the authenticated user
 */
export const getMedications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const activeOnly = req.query.active !== 'false';
    const medications = await medicationService.getMedications(
      req.user!.userId,
      activeOnly
    );

    res.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a single medication by ID
 */
export const getMedication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const medication = await medicationService.getMedicationById(
      req.user!.userId,
      req.params.id
    );

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    res.json({ medication });
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create a new medication
 */
export const createMedication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const medication = await medicationService.createMedication(
      req.user!.userId,
      req.body
    );

    res.status(201).json({ medication });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      res.status(409).json({ error: 'A medication with this name already exists' });
      return;
    }

    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a medication
 */
export const updateMedication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const medication = await medicationService.updateMedication(
      req.user!.userId,
      req.params.id,
      req.body
    );

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    res.json({ medication });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete (deactivate) a medication
 */
export const deleteMedication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const permanent = req.query.permanent === 'true';

    let success: boolean;
    if (permanent) {
      success = await medicationService.permanentlyDeleteMedication(
        req.user!.userId,
        req.params.id
      );
    } else {
      success = await medicationService.deleteMedication(
        req.user!.userId,
        req.params.id
      );
    }

    if (!success) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Log a dose (taken/skipped)
 */
export const logDose = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const doseLog = await medicationService.logDose(req.user!.userId, {
      medication_id: req.params.id,
      ...req.body,
    });

    res.status(201).json({ doseLog });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Medication not found') {
      res.status(404).json({ error: err.message });
      return;
    }

    console.error('Log dose error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get dose logs for a medication
 */
export const getDoseLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : undefined;

    const logs = await medicationService.getDoseLogs(
      req.user!.userId,
      req.params.id,
      startDate,
      endDate
    );

    res.json({ logs });
  } catch (error) {
    console.error('Get dose logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get today's doses for all medications
 */
export const getTodaysDoses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const todaysDoses = await medicationService.getTodaysDoses(req.user!.userId);

    res.json({ todaysDoses });
  } catch (error) {
    console.error('Get todays doses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get adherence stats for a medication
 */
export const getAdherenceStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const stats = await medicationService.getAdherenceStats(
      req.user!.userId,
      req.params.id,
      days
    );

    res.json({ stats });
  } catch (error) {
    console.error('Get adherence stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get medications needing refill
 */
export const getMedicationsNeedingRefill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const medications = await medicationService.getMedicationsNeedingRefill(
      req.user!.userId
    );

    res.json({ medications });
  } catch (error) {
    console.error('Get refill medications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refill medication inventory
 */
export const refillMedication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const medication = await medicationService.refillMedication(
      req.user!.userId,
      req.params.id,
      req.body.count
    );

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    res.json({ medication });
  } catch (error) {
    console.error('Refill medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Extract medication info from bottle image using Claude Vision
 * POST /api/medications/extract-from-image
 */
export const extractFromBottleImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { extractMedicationFromImage } = await import('../services/visionService');

    // Convert buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = (req.file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg';

    // Extract medication info from image
    const extractedData = await extractMedicationFromImage(imageBase64, mimeType);

    res.json({
      success: true,
      data: extractedData,
      message: 'Medication information extracted. Please review and correct as needed.',
    });
  } catch (error) {
    console.error('Extract from bottle image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract medication information';
    res.status(400).json({ error: errorMessage });
  }
};

/**
 * Save a medication with bottle image
 * POST /api/medications/with-image
 */
export const createMedicationWithImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { uploadPhoto } = await import('../services/storageService');

    // Upload bottle image if provided
    let bottleImageUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadPhoto(
        req.user!.userId,
        req.file,
        'medication-bottle'
      );
      bottleImageUrl = uploadResult.url;
    }

    // Create medication with image URL
    const medicationData = {
      ...req.body,
      bottle_image_url: bottleImageUrl,
      ocr_extracted_at: req.body.ocr_extracted_at ? new Date(req.body.ocr_extracted_at) : undefined,
    };

    const medication = await medicationService.createMedication(
      req.user!.userId,
      medicationData
    );

    res.status(201).json({ medication });
  } catch (error) {
    console.error('Create medication with image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update medication with new bottle image
 * PUT /api/medications/:id/bottle-image
 */
export const updateBottleImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { uploadPhoto, deletePhoto } = await import('../services/storageService');
    const Medication = require('../models/Medication').default;

    // Get existing medication
    const medication = await Medication.findOne({
      _id: req.params.id,
      user_id: req.user!.userId,
    });

    if (!medication) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }

    // Delete old image if exists
    if (medication.bottle_image_url) {
      try {
        const oldFilename = medication.bottle_image_url.split('/').pop();
        if (oldFilename) {
          await deletePhoto(oldFilename);
        }
      } catch (error) {
        console.error('Failed to delete old bottle image:', error);
      }
    }

    // Upload new image
    const uploadResult = await uploadPhoto(
      req.user!.userId,
      req.file,
      'medication-bottle'
    );

    // Update medication
    medication.bottle_image_url = uploadResult.url;
    if (req.body.ocr_extracted_at) {
      medication.ocr_extracted_at = new Date(req.body.ocr_extracted_at);
    }
    await medication.save();

    res.json({ medication });
  } catch (error) {
    console.error('Update bottle image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
