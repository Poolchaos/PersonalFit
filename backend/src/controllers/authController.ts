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

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      res.status(400).json({
        error: errorMessages.join('. '),
        details: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password_hash: password, // Will be hashed by pre-save hook
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: (user._id as string).toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: (user._id as string).toString(),
      email: user.email,
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: (user._id as string).toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: (user._id as string).toString(),
      email: user.email,
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('_id email');
    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};
