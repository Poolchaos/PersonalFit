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

/**
 * AI Module Index - Exports for the AI orchestration layer
 */

// Core types
export * from './types';

// Token management
export { TokenManager, getTokenManager, DEFAULT_WORKOUT_BUDGET } from './tokenManager';
export type { TokenEstimate, TokenBudget } from './tokenManager';

// Retry utilities
export { withRetry, simpleRetry, createRetryWrapper } from './retryUtils';
export type { RetryContext, RetryResult } from './retryUtils';

// Response validation
export {
  parseAIResponse,
  validateWithSchema,
  safeParse,
  validateWorkoutPlan,
  validateWorkoutSession,
  validateExercise,
  validatePartial,
  coerceAndValidate,
  extractWorkoutPlans,
  createValidationErrorPrompt,
} from './responseValidator';
export type { ValidationResult, ValidationError } from './responseValidator';

// Orchestration service
export { AIOrchestrationService, getOrchestrationService } from './orchestrationService';
