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

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables from .env.test if it exists, otherwise fallback to .env
const testEnvPath = path.resolve(process.cwd(), '.env.test');
const envPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: testEnvPath });
// Fallback to .env if .env.test doesn't exist
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: envPath });
}
