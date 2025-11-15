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
