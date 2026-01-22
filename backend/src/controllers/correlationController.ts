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

import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import {
  getCorrelationInsights,
  runCorrelationAnalysis,
} from '../services/correlationAnalysisService';
import { Medication } from '../models/Medication';

/**
 * Get correlation insights for the authenticated user
 * GET /api/medications/correlations
 */
export const getCorrelations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const insights = await getCorrelationInsights(userId);

    // Populate medication names
    const populatedInsights = await Promise.all(
      insights.map(async (insight) => {
        const medication = await Medication.findById(insight.medication_id);
        return {
          ...insight.toObject(),
          medication_name: medication?.name || 'Unknown',
        };
      })
    );

    res.json({
      success: true,
      data: populatedInsights,
    });
  } catch (error) {
    console.error('Error fetching correlation insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correlation insights',
    });
  }
};

/**
 * Trigger correlation analysis for the authenticated user
 * POST /api/medications/correlations/analyze
 */
export const triggerAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Run analysis asynchronously (don't wait for completion)
    runCorrelationAnalysis(userId).catch((error) => {
      console.error('Background correlation analysis failed:', error);
    });

    res.json({
      success: true,
      message: 'Correlation analysis started',
    });
  } catch (error) {
    console.error('Error triggering correlation analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger correlation analysis',
    });
  }
};
