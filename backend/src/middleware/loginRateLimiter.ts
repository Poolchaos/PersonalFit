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

import { Request, Response, NextFunction } from 'express';
import LoginAttempt from '../models/LoginAttempt';

// Configuration
const MAX_FAILED_ATTEMPTS = 5; // Maximum failed attempts before lockout
const LOCKOUT_WINDOW_MINUTES = 15; // Time window to count failures
const LOCKOUT_DURATION_MINUTES = 15; // How long to lock out after max failures

/**
 * Rate limiting middleware for login endpoint.
 * 
 * Blocks login attempts if there have been too many recent failed attempts
 * for the same email address. This prevents brute-force attacks on specific
 * accounts regardless of what IP the attacker uses.
 */
export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.body.email;
    
    if (!email) {
      // If no email provided, let the route handler deal with validation
      return next();
    }
    
    // Count recent failed attempts for this email
    const failedAttempts = await LoginAttempt.countRecentFailedAttempts(
      email,
      LOCKOUT_WINDOW_MINUTES
    );
    
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Calculate when lockout expires
      const lockoutEnds = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      );
      
      res.status(429).json({
        error: 'Too many failed login attempts. Please try again later.',
        retry_after_minutes: LOCKOUT_DURATION_MINUTES,
        lockout_ends: lockoutEnds.toISOString(),
      });
      return;
    }
    
    next();
  } catch (error) {
    // Log but don't block on rate limiter errors - fail open for availability
    console.error('Login rate limiter error:', error);
    next();
  }
};

/**
 * Record a successful login attempt.
 * Call this after successful authentication to track the attempt.
 */
export const recordSuccessfulLogin = async (
  email: string,
  ipAddress: string
): Promise<void> => {
  try {
    await LoginAttempt.recordAttempt(email, ipAddress, true);
    // Optionally: clear old failed attempts on successful login
    // await LoginAttempt.clearFailedAttempts(email);
  } catch (error) {
    console.error('Error recording successful login:', error);
  }
};

/**
 * Record a failed login attempt.
 * Call this after failed authentication to track the attempt.
 */
export const recordFailedLogin = async (
  email: string,
  ipAddress: string
): Promise<void> => {
  try {
    await LoginAttempt.recordAttempt(email, ipAddress, false);
  } catch (error) {
    console.error('Error recording failed login:', error);
  }
};

/**
 * Get the client's IP address from the request.
 * Handles X-Forwarded-For header for proxied requests.
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // X-Forwarded-For can contain multiple IPs; take the first one
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};
