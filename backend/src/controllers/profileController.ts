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
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password_hash');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        preferences: user.preferences,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update profile fields
    if (req.body.profile) {
      user.profile = {
        ...user.profile,
        ...req.body.profile,
      };
    }

    // Update preferences
    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences,
      };
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        preferences: user.preferences,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
