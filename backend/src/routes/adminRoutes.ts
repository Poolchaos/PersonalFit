import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { triggerDetection } from '../controllers/adminController';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Manually trigger missed workout detection
router.post('/trigger-missed-workout-detection', triggerDetection);

export default router;
