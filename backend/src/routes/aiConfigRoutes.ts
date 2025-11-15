import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAIConfig,
  updateAIConfig,
  testAIConfig,
  deleteAIConfig,
} from '../controllers/aiConfigController';
import { updateAIConfigValidation } from '../validators/aiConfigValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get AI configuration (without API key)
router.get('/', getAIConfig);

// Update AI configuration
router.patch('/', updateAIConfigValidation, updateAIConfig);

// Test AI configuration
router.post('/test', testAIConfig);

// Delete AI API key
router.delete('/api-key', deleteAIConfig);

export default router;
