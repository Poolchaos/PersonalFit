import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { triggerMissedWorkoutDetection } from '../services/missedWorkoutService';

/**
 * Manually trigger missed workout detection
 * POST /api/admin/trigger-missed-workout-detection
 */
export const triggerDetection = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await triggerMissedWorkoutDetection();

    if (result.success) {
      res.json({
        message: 'Missed workout detection completed',
        ...result.result,
      });
    } else {
      res.status(500).json({
        error: 'Failed to process missed workouts',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Trigger detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
