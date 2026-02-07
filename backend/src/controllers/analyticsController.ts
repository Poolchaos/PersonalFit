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
import AnalyticsEvent from '../models/AnalyticsEvent';
import { AuthRequest } from '../middleware/auth';

export const trackEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const event = new AnalyticsEvent({
      user_id: new mongoose.Types.ObjectId(req.user?.userId),
      event_name: req.body.event_name,
      metadata: req.body.metadata || {},
    });

    await event.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Track analytics event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
