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

import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

// Extended request type with user info from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Creates a rate limiter that uses user ID from JWT token as the key.
 * This ensures each authenticated user gets their own rate limit quota,
 * avoiding issues with multiple users behind the same NAT/IP.
 * 
 * Falls back to IP-based limiting for unauthenticated requests.
 */
export const createUserRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 60, // 60 requests per minute default
    message = 'Too many requests. Please slow down.',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipFailedRequests,
    skipSuccessfulRequests,
    // Key generator: use user ID if authenticated, otherwise fall back to IP
    keyGenerator: (req: Request): string => {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.userId) {
        return `user:${authReq.user.userId}`;
      }
      // Fallback to IP for unauthenticated requests
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return `ip:${forwarded.split(',')[0].trim()}`;
      }
      return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    },
    // Custom handler for when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: message,
        retry_after_ms: windowMs,
      });
    },
  } as Partial<Options>);
};

/**
 * General API rate limiter for authenticated endpoints.
 * 100 requests per minute per user.
 */
export const apiRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many API requests. Please slow down.',
});

/**
 * Stricter rate limiter for resource-intensive endpoints (AI generation, etc).
 * 10 requests per minute per user.
 */
export const strictRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests to this resource. Please wait before trying again.',
});

/**
 * Very strict rate limiter for extremely expensive operations.
 * 3 requests per minute per user.
 */
export const heavyRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: 'This operation is rate limited. Please wait before trying again.',
});
