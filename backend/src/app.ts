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

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import workoutRoutes from './routes/workoutRoutes';
import sessionRoutes from './routes/sessionRoutes';
import progressRoutes from './routes/progressRoutes';
import metricsRoutes from './routes/metricsRoutes';
import aiConfigRoutes from './routes/aiConfigRoutes';
import accountabilityRoutes from './routes/accountabilityRoutes';
import adminRoutes from './routes/adminRoutes';
import photoRoutes from './routes/photoRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import prRoutes from './routes/prRoutes';
import dailyChallengeRoutes from './routes/dailyChallengeRoutes';
import medicationRoutes from './routes/medicationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import habitRoutes from './routes/habitRoutes';
import visionRoutes from './routes/visionRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import healthScoreRoutes from './routes/healthScoreRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import dailyHealthLoopRoutes from './routes/dailyHealthLoopRoutes';
import goalsRoutes from './routes/goalsRoutes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.cors_origin.split(',').map(origin => origin.trim()),
  credentials: true,
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Skip rate limiting in test environment
const isTestEnv = config.node_env === 'test';

// Extended request type with user info from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Lightweight JWT decoder for rate limiting key generation.
// Only decodes payload without verification - we just need the userId for keying.
// Actual authentication is handled by the authenticate middleware.
const decodeJwtPayload = (token: string): { userId: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.userId ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
};

// Key generator that uses user ID if authenticated, otherwise IP.
// This ensures per-user rate limiting for authenticated users,
// avoiding the NAT-sharing issue where multiple users behind the same IP
// would share the same rate limit quota.
const getUserOrIpKey = (req: Request): string => {
  // First check if user is already set by auth middleware
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId) {
    return `user:${authReq.user.userId}`;
  }
  
  // Try to extract user ID from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = decodeJwtPayload(token);
    if (payload?.userId) {
      return `user:${payload.userId}`;
    }
  }
  
  // Fallback to IP for unauthenticated requests
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
};

// Rate limiting - General API (per-user for authenticated, per-IP for anonymous)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  keyGenerator: getUserOrIpKey,
});

// Rate limiting - Auth endpoints (stricter, always IP-based since not yet authenticated)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

// Rate limiting - AI generation (very strict, per-user)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: { error: 'AI generation rate limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  keyGenerator: getUserOrIpKey,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/workouts', aiLimiter, workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/challenges', dailyChallengeRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/vision', aiLimiter, visionRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/health-scores', healthScoreRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/daily-loop', dailyHealthLoopRoutes);
app.use('/api/goals', goalsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Multer error handler (must come before general error handler)
app.use((err: Error & { code?: string }, _req: Request, res: Response, next: NextFunction) => {
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File size exceeds 10MB limit' });
    return;
  }
  if (err.code && err.code.startsWith('LIMIT_')) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message && err.message.includes('Invalid file type')) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
