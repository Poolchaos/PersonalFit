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

import { initializeScheduler, runMissedWorkoutDetection } from '../services/schedulerService';
import * as missedWorkoutService from '../services/missedWorkoutService';

// Mock node-cron
jest.mock('node-cron');

// Mock missed workout service
jest.mock('../services/missedWorkoutService');

describe('Scheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initializeScheduler', () => {
    it('should initialize scheduler without errors', () => {
      expect(() => initializeScheduler()).not.toThrow();
    });

    it('should log initialization messages', () => {
      initializeScheduler();

      expect(console.log).toHaveBeenCalledWith('ðŸ• Initializing scheduled tasks...');
      expect(console.log).toHaveBeenCalledWith('âœ… Scheduler initialized successfully');
      expect(console.log).toHaveBeenCalledWith('   - Missed workout detection: Daily at 00:00 UTC');
    });
  });

  describe('runMissedWorkoutDetection', () => {
    it('should run detection successfully', async () => {
      const mockResults = [
        { user_id: 'user1', missed_count: 2 },
        { user_id: 'user2', missed_count: 1 },
      ];

      (missedWorkoutService.findMissedWorkouts as jest.Mock).mockResolvedValue(mockResults);

      await runMissedWorkoutDetection();

      expect(missedWorkoutService.findMissedWorkouts).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('ðŸ”„ Running manual missed workout detection...');
      expect(console.log).toHaveBeenCalledWith(`âœ… Detection completed: ${mockResults.length} users processed`);
    });

    it('should handle detection errors', async () => {
      const error = new Error('Detection failed');
      (missedWorkoutService.findMissedWorkouts as jest.Mock).mockRejectedValue(error);

      await expect(runMissedWorkoutDetection()).rejects.toThrow('Detection failed');

      expect(console.error).toHaveBeenCalledWith('âŒ Manual detection failed:', error);
    });

    it('should process empty results', async () => {
      (missedWorkoutService.findMissedWorkouts as jest.Mock).mockResolvedValue([]);

      await runMissedWorkoutDetection();

      expect(console.log).toHaveBeenCalledWith('âœ… Detection completed: 0 users processed');
    });
  });
});
