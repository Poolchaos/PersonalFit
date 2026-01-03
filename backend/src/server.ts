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

import app from './app';
import { connectDatabase } from './config/database';
import { initializeStorage } from './services/storageService';
import { initializeScheduler } from './services/schedulerService';
import config from './config';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize MinIO storage
    await initializeStorage();

    // Initialize scheduled tasks (cron jobs)
    initializeScheduler();

    // Start server
    app.listen(config.port, () => {
      console.warn(`Server running on port ${config.port} in ${config.node_env} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
