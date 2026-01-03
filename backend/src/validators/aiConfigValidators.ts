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

import { body } from 'express-validator';

export const updateAIConfigValidation = [
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic', 'local', 'custom'])
    .withMessage('Provider must be one of: openai, anthropic, local, custom'),
  body('api_key')
    .optional()
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('API key must be between 10 and 500 characters'),
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model name must be 100 characters or less'),
  body('endpoint_url')
    .optional()
    .isURL({ require_tld: false })
    .withMessage('Endpoint URL must be a valid URL'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean value'),
];
