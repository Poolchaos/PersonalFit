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
 * Retry Utility - Exponential backoff with model fallback
 * Provides resilient AI request handling with configurable retry strategies
 */

import { RetryConfig, DEFAULT_RETRY_CONFIG } from './types';

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  lastError: Error | null;
  currentModel: string;
  startTime: number;
  delays: number[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  context: RetryContext;
  modelUsed: string;
}

type RetryableFunction<T> = (model: string, attempt: number) => Promise<T>;

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential backoff: baseDelay * (exponentialBase ^ attempt)
  const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt);

  // Add jitter (Â±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

  // Clamp to max delay
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  return config.retryableErrors.some(retryableError => {
    const lowerRetryable = retryableError.toLowerCase();
    return errorMessage.includes(lowerRetryable) || errorName.includes(lowerRetryable);
  });
}

/**
 * Check if we should fallback to next model
 */
function shouldFallbackModel(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();

  // Model-specific errors that warrant fallback
  const fallbackTriggers = [
    'model not found',
    'model_not_available',
    'quota exceeded',
    'billing',
    'insufficient_quota',
    'context_length_exceeded',
  ];

  return fallbackTriggers.some(trigger => errorMessage.includes(trigger));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic and model fallback
 */
export async function withRetry<T>(
  fn: RetryableFunction<T>,
  initialModel: string,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  const context: RetryContext = {
    attempt: 0,
    totalAttempts: 0,
    lastError: null,
    currentModel: initialModel,
    startTime: Date.now(),
    delays: [],
  };

  // Build model fallback order starting with initial model
  const modelOrder = [initialModel];
  for (const model of fullConfig.modelFallbackOrder) {
    if (!modelOrder.includes(model)) {
      modelOrder.push(model);
    }
  }

  let currentModelIndex = 0;

  while (currentModelIndex < modelOrder.length) {
    context.currentModel = modelOrder[currentModelIndex];
    let modelAttempt = 0;

    while (modelAttempt <= fullConfig.maxRetries) {
      context.attempt = modelAttempt;
      context.totalAttempts++;

      try {
        const result = await fn(context.currentModel, modelAttempt);
        return {
          success: true,
          data: result,
          context,
          modelUsed: context.currentModel,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        context.lastError = err;

        // Check if we should fallback to next model
        if (shouldFallbackModel(err)) {
          console.warn(
            `Model ${context.currentModel} failed with model-specific error, falling back to next model`,
            { error: err.message }
          );
          break; // Move to next model
        }

        // Check if error is retryable
        if (!isRetryableError(err, fullConfig)) {
          console.error(`Non-retryable error encountered`, { error: err.message });
          return {
            success: false,
            error: err,
            context,
            modelUsed: context.currentModel,
          };
        }

        // Check if we have retries left for this model
        if (modelAttempt >= fullConfig.maxRetries) {
          console.warn(
            `Max retries (${fullConfig.maxRetries}) reached for model ${context.currentModel}`,
            { error: err.message }
          );
          break; // Move to next model
        }

        // Calculate and apply delay
        const delay = calculateDelay(modelAttempt, fullConfig);
        context.delays.push(delay);

        console.info(
          `Retrying in ${Math.round(delay)}ms (attempt ${modelAttempt + 1}/${fullConfig.maxRetries})`,
          { model: context.currentModel, error: err.message }
        );

        await sleep(delay);
        modelAttempt++;
      }
    }

    currentModelIndex++;
  }

  // All models exhausted
  return {
    success: false,
    error: context.lastError || new Error('All retry attempts exhausted'),
    context,
    modelUsed: context.currentModel,
  };
}

/**
 * Create a retry wrapper with preset configuration
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}): {
  execute: <T>(fn: RetryableFunction<T>, initialModel: string) => Promise<RetryResult<T>>;
  config: RetryConfig;
} {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  return {
    execute: <T>(fn: RetryableFunction<T>, initialModel: string) =>
      withRetry(fn, initialModel, fullConfig),
    config: fullConfig,
  };
}

/**
 * Simple retry without model fallback
 */
export async function simpleRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
