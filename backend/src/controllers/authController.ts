/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import config from '../config';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  recordSuccessfulLogin,
  recordFailedLogin,
  getClientIp,
} from '../middleware/loginRateLimiter';

// Helper to calculate token expiration date from config string (e.g., "7d")
const getRefreshTokenExpiresAt = (): Date => {
  const expiresIn = config.jwt_refresh_expires_in;
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 7 days if parsing fails
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
};

// Helper to store refresh token in database
const storeRefreshToken = async (
  token: string,
  userId: string,
  deviceInfo?: string
): Promise<void> => {
  const tokenHash = RefreshToken.hashToken(token);
  const expiresAt = getRefreshTokenExpiresAt();

  await RefreshToken.create({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
    device_info: deviceInfo,
  });
};

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
    const userId = (user._id as string).toString();
    const accessToken = generateAccessToken({
      userId,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId,
      email: user.email,
    });

    // Store refresh token hash in database
    const deviceInfo = req.get('User-Agent');
    await storeRefreshToken(refreshToken, userId, deviceInfo);

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
    const clientIp = getClientIp(req);

    // Find user with password hash (excluded by default via select: false)
    const user = await User.findOne({ email }).select('+password_hash');
    if (!user) {
      // Record failed attempt (user not found)
      await recordFailedLogin(email, clientIp);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Record failed attempt (wrong password)
      await recordFailedLogin(email, clientIp);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Record successful login
    await recordSuccessfulLogin(email, clientIp);

    // Generate tokens
    const userId = (user._id as string).toString();
    const accessToken = generateAccessToken({
      userId,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId,
      email: user.email,
    });

    // Store refresh token hash in database
    const deviceInfo = req.get('User-Agent');
    await storeRefreshToken(refreshToken, userId, deviceInfo);

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
    const { refreshToken: oldToken } = req.body;

    if (!oldToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify the JWT signature and expiration
    let payload;
    try {
      payload = verifyRefreshToken(oldToken);
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Check if token exists in database and is not revoked
    const oldTokenHash = RefreshToken.hashToken(oldToken);
    const storedToken = await RefreshToken.findValidToken(oldTokenHash);

    if (!storedToken) {
      // Token not found or already revoked - potential token reuse attack
      // Revoke all tokens for this user as a security measure
      await RefreshToken.revokeAllUserTokens(payload.userId);
      res.status(401).json({ error: 'Invalid refresh token - all sessions revoked for security' });
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('_id email');
    if (!user) {
      // Revoke the token since user no longer exists
      await RefreshToken.revokeToken(oldTokenHash);
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    // Generate new tokens (rotation)
    const userId = payload.userId;
    const accessToken = generateAccessToken({
      userId,
      email: payload.email,
    });
    const newRefreshToken = generateRefreshToken({
      userId,
      email: payload.email,
    });

    // Store the new refresh token
    const deviceInfo = req.get('User-Agent');
    const newTokenHash = RefreshToken.hashToken(newRefreshToken);
    const newTokenDoc = await RefreshToken.create({
      token_hash: newTokenHash,
      user_id: userId,
      expires_at: getRefreshTokenExpiresAt(),
      device_info: deviceInfo,
    });

    // Revoke the old token and link it to the new one
    await RefreshToken.revokeToken(oldTokenHash, newTokenDoc._id as Types.ObjectId);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Revoke the token
    const tokenHash = RefreshToken.hashToken(refreshToken);
    await RefreshToken.revokeToken(tokenHash);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by authenticate middleware
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const revokedCount = await RefreshToken.revokeAllUserTokens(userId);

    res.json({
      message: 'Logged out from all devices',
      sessions_revoked: revokedCount,
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
