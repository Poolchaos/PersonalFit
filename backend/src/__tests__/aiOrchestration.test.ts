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
 * AI Orchestration Layer Tests
 * Tests for token management, retry logic, validation, and orchestration
 */

import {
  TokenManager,
  DEFAULT_WORKOUT_BUDGET,
  withRetry,
  simpleRetry,
  parseAIResponse,
  validateWorkoutPlan,
  coerceAndValidate,
  createValidationErrorPrompt,
  WorkoutPlanSchema,
  ExerciseSchema,
  DEFAULT_RETRY_CONFIG,
} from '../services/ai';

describe('AI Orchestration Layer', () => {
  describe('TokenManager', () => {
    let tokenManager: TokenManager;

    beforeEach(() => {
      tokenManager = new TokenManager('gpt-4o-mini');
    });

    afterEach(() => {
      tokenManager.dispose();
    });

    it('should count tokens in a string', () => {
      const text = 'Hello, world! This is a test.';
      const tokenCount = tokenManager.countTokens(text);

      // Should be reasonable token count (roughly 1 token per 4 chars)
      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeLessThan(text.length);
    });

    it('should count tokens in chat messages', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ];

      const tokenCount = tokenManager.countMessageTokens(messages);

      // Should include message overhead
      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeGreaterThan(tokenManager.countTokens('You are a helpful assistant.Hello!'));
    });

    it('should estimate request tokens and cost', () => {
      const systemPrompt = 'You are a fitness coach.';
      const userPrompt = 'Create a workout plan for a beginner.';

      const estimate = tokenManager.estimateRequest(systemPrompt, userPrompt);

      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.estimatedOutputTokens).toBeGreaterThan(0);
      expect(estimate.totalTokens).toBe(estimate.inputTokens + estimate.estimatedOutputTokens);
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.modelContextLimit).toBeGreaterThan(0);
      expect(estimate.withinBudget).toBe(true);
    });

    it('should check budget constraints', () => {
      const estimate = {
        inputTokens: 5000,
        estimatedOutputTokens: 3000,
        totalTokens: 8000,
        estimatedCost: 0.05,
        modelContextLimit: 128000,
        withinBudget: true,
      };

      const result = tokenManager.checkBudget(estimate, DEFAULT_WORKOUT_BUDGET);

      expect(result.allowed).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject requests exceeding budget', () => {
      const estimate = {
        inputTokens: 50000, // Exceeds default limit
        estimatedOutputTokens: 10000,
        totalTokens: 60000,
        estimatedCost: 5.0, // Exceeds default cost limit
        modelContextLimit: 128000,
        withinBudget: true,
      };

      const result = tokenManager.checkBudget(estimate, DEFAULT_WORKOUT_BUDGET);

      expect(result.allowed).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should truncate text to token limit', () => {
      const longText = 'This is a test. '.repeat(100);
      const maxTokens = 10;

      const truncated = tokenManager.truncateToTokenLimit(longText, maxTokens);

      expect(tokenManager.countTokens(truncated)).toBeLessThanOrEqual(maxTokens + 1); // Allow 1 token margin
    });

    it('should get model configuration', () => {
      const config = tokenManager.getModelConfig();

      expect(config.contextLimit).toBeGreaterThan(0);
      expect(config.inputPrice).toBeGreaterThan(0);
      expect(config.outputPrice).toBeGreaterThan(0);
    });
  });

  describe('Retry Utilities', () => {
    it('should succeed on first attempt', async () => {
      let callCount = 0;

      const result = await withRetry(
        async () => {
          callCount++;
          return 'success';
        },
        'gpt-4o-mini'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(callCount).toBe(1);
    });

    it('should retry on retryable errors', async () => {
      let callCount = 0;

      const result = await withRetry(
        async () => {
          callCount++;
          if (callCount < 3) {
            throw new Error('rate_limit_exceeded');
          }
          return 'success';
        },
        'gpt-4o-mini',
        { maxRetries: 5, baseDelayMs: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      let callCount = 0;

      const result = await withRetry(
        async () => {
          callCount++;
          throw new Error('invalid_input');
        },
        'gpt-4o-mini',
        { maxRetries: 3, baseDelayMs: 10 }
      );

      expect(result.success).toBe(false);
      expect(callCount).toBe(1);
    });

    it('should fallback to next model on model-specific errors', async () => {
      const modelsUsed: string[] = [];

      const result = await withRetry(
        async (model) => {
          modelsUsed.push(model);
          if (model === 'gpt-4o-mini') {
            throw new Error('quota exceeded');
          }
          return 'success';
        },
        'gpt-4o-mini',
        { maxRetries: 1, baseDelayMs: 10 }
      );

      expect(result.success).toBe(true);
      expect(modelsUsed.length).toBeGreaterThan(1);
      expect(modelsUsed[0]).toBe('gpt-4o-mini');
    });

    it('should provide retry context', async () => {
      const result = await withRetry(
        async () => 'success',
        'gpt-4o-mini'
      );

      expect(result.context).toBeDefined();
      expect(result.context.startTime).toBeLessThanOrEqual(Date.now());
      expect(result.modelUsed).toBe('gpt-4o-mini');
    });

    describe('simpleRetry', () => {
      it('should retry simple functions', async () => {
        let callCount = 0;

        const result = await simpleRetry(
          async () => {
            callCount++;
            if (callCount < 2) throw new Error('fail');
            return 'success';
          },
          3,
          10
        );

        expect(result).toBe('success');
        expect(callCount).toBe(2);
      });

      it('should throw after max retries', async () => {
        await expect(
          simpleRetry(
            async () => { throw new Error('always fails'); },
            2,
            10
          )
        ).rejects.toThrow('always fails');
      });
    });
  });

  describe('Response Validator', () => {
    it('should parse valid JSON from AI response', () => {
      const response = '{"name": "Beginner Plan", "goal": "fitness", "durationWeeks": 4, "sessionsPerWeek": 3, "sessions": []}';

      const result = parseAIResponse(response, WorkoutPlanSchema);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Beginner Plan');
    });

    it('should extract JSON from markdown code blocks', () => {
      const response = `Here's your plan:
\`\`\`json
{"name": "Beginner Plan", "goal": "fitness", "durationWeeks": 4, "sessionsPerWeek": 3, "sessions": []}
\`\`\`
Let me know if you need changes!`;

      const result = parseAIResponse(response, WorkoutPlanSchema);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Beginner Plan');
    });

    it('should handle invalid JSON', () => {
      const response = 'This is not JSON {broken';

      const result = parseAIResponse(response, WorkoutPlanSchema);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('invalid_json');
    });

    it('should validate workout plan schema', () => {
      const validPlan = {
        name: 'Test Plan',
        goal: 'Build muscle',
        durationWeeks: 8,
        sessionsPerWeek: 4,
        sessions: [
          {
            dayOfWeek: 1,
            sessionType: 'strength',
            duration: 60,
            mainWorkout: [
              {
                name: 'Push-ups',
                category: 'strength',
                sets: 3,
                reps: 12,
              },
            ],
          },
        ],
      };

      const result = validateWorkoutPlan(validPlan);

      expect(result.success).toBe(true);
    });

    it('should reject invalid workout plan', () => {
      const invalidPlan = {
        name: '', // Empty name (min 1)
        goal: 'fitness',
        durationWeeks: 100, // Exceeds max 52
        sessionsPerWeek: 8, // Exceeds max 7
        sessions: [],
      };

      const result = validateWorkoutPlan(invalidPlan);

      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should coerce common AI response issues', () => {
      const dataWithIssues = {
        name: 'Test',
        category: 'strength',
        sets: '3', // String instead of number
        reps: 12,
        equipment: 'dumbbell', // Single value instead of array
      };

      const result = coerceAndValidate(dataWithIssues, ExerciseSchema);

      expect(result.success).toBe(true);
      expect(result.data?.sets).toBe(3);
      expect(Array.isArray(result.data?.equipment)).toBe(true);
    });

    it('should create validation error prompt', () => {
      const errors = [
        { path: 'name', message: 'String must contain at least 1 character(s)', code: 'too_small' },
        { path: 'durationWeeks', message: 'Number must be at most 52', code: 'too_big', expected: 'â‰¤52' },
      ];

      const prompt = createValidationErrorPrompt(errors);

      expect(prompt).toContain('validation errors');
      expect(prompt).toContain('name');
      expect(prompt).toContain('durationWeeks');
    });
  });

  describe('Configuration', () => {
    it('should have default retry config', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_CONFIG.modelFallbackOrder.length).toBeGreaterThan(0);
    });

    it('should have default workout budget', () => {
      expect(DEFAULT_WORKOUT_BUDGET.maxInputTokens).toBeGreaterThan(0);
      expect(DEFAULT_WORKOUT_BUDGET.maxOutputTokens).toBeGreaterThan(0);
      expect(DEFAULT_WORKOUT_BUDGET.maxCostUSD).toBeGreaterThan(0);
    });
  });
});
