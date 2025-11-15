import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProgress } from '../controllers/progressController';

const router = Router();

router.get('/', authenticate, getProgress);

export default router;
