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

import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, refresh, logout, logoutAll } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/loginRateLimiter';

const router = Router();

// Signup route
router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  signup
);

// Login route with per-account rate limiting
router.post(
  '/login',
  loginRateLimiter, // Check rate limit before processing login
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

// Refresh token route (now includes token rotation)
router.post('/refresh', refresh);

// Logout route (revokes current refresh token)
router.post('/logout', logout);

// Logout from all devices (requires authentication)
router.post('/logout-all', authenticate, logoutAll);

export default router;
