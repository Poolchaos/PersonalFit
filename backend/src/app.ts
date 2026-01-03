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

// Rate limiting - General API
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

// Rate limiting - Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

// Rate limiting - AI generation (very strict)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: { error: 'AI generation rate limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
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
