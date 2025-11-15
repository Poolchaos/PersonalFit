import { Response } from 'express';
import { calculateProgressStats } from '../services/progressService';
import { AuthRequest } from '../middleware/auth';

export const getProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const stats = await calculateProgressStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ message: 'Failed to get progress stats' });
  }
};
