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

import OpenAI from 'openai';

export interface OpenAIValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorType?: string;
  details?: {
    canAccessModels: boolean;
    canCreateCompletions: boolean;
    organizationId?: string;
    quotaRemaining?: boolean;
  };
}

/**
 * Validates an OpenAI API key by making actual API calls
 * Tests: authentication, model access, and completion capability
 */
export async function validateOpenAIKey(apiKey: string): Promise<OpenAIValidationResult> {
  const startTime = Date.now();
  try {
    const client = new OpenAI({ apiKey });
    const details: {
      canAccessModels: boolean;
      canCreateCompletions: boolean;
      organizationId?: string;
      quotaRemaining?: boolean;
    } = {
      canAccessModels: false,
      canCreateCompletions: false,
    };
    const result: OpenAIValidationResult = {
      valid: false,
      details,
    };

    // Test 1: List available models
    console.log('\n[Test 1] Attempting to list models...');
    try {
      const models = await client.models.list();
      const modelArray = [];
      for await (const model of models) {
        modelArray.push(model.id);
      }
      details.canAccessModels = true;
      console.log('âœ“ Models accessible:', modelArray.length, 'models found');
      console.log('Sample models:', modelArray.slice(0, 3).join(', '));
    } catch (error) {
      console.error('âœ— Model list failed:', error);
      result.error = 'Cannot access models';
      result.errorCode = (error as { code?: string }).code;
      result.errorType = (error as { type?: string }).type;
      return result;
    }

    // Test 2: Make a minimal completion request
    console.log('\n[Test 2] Attempting minimal completion...');
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      details.canCreateCompletions = true;
      details.organizationId = (completion as { organization?: string }).organization;
      console.log('âœ“ Completion successful');
      console.log('Response ID:', completion.id);
      console.log('Model used:', completion.model);
      console.log('Organization:', details.organizationId || 'N/A');

      // Check usage to determine if quota exists
      if (completion.usage) {
        console.log('Usage:', JSON.stringify(completion.usage));
        details.quotaRemaining = true;
      }
    } catch (error) {
      console.error('âœ— Completion failed:', error);
      const err = error as {
        status?: number;
        code?: string;
        type?: string;
        message?: string;
        error?: { message?: string; type?: string; code?: string };
      };

      result.error = err.error?.message || err.message || 'Completion request failed';
      result.errorCode = err.error?.code || err.code;
      result.errorType = err.error?.type || err.type;

      console.error('Error details:', {
        status: err.status,
        code: result.errorCode,
        type: result.errorType,
        message: result.error,
      });

      return result;
    }

    // All tests passed
    result.valid = true;
    const duration = Date.now() - startTime;
    console.log('\nâœ“ All validation tests passed');
    console.log('Validation duration:', duration + 'ms');
    console.log('=== Validation Complete ===\n');

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\nâœ— Validation failed with exception');
    console.error('Duration:', duration + 'ms');
    console.error('Error:', error);
    console.error('=== Validation Failed ===\n');

    const err = error as {
      status?: number;
      code?: string;
      type?: string;
      message?: string;
      error?: { message?: string; type?: string; code?: string };
    };

    return {
      valid: false,
      error: err.error?.message || err.message || 'Validation failed',
      errorCode: err.error?.code || err.code,
      errorType: err.error?.type || err.type,
    };
  }
}

/**
 * Logs detailed information about an OpenAI API error
 */
export function logOpenAIError(error: unknown, context: string): void {
  console.error(`\n=== OpenAI Error in ${context} ===`);
  console.error('Timestamp:', new Date().toISOString());

  if (error && typeof error === 'object') {
    const err = error as {
      status?: number;
      code?: string;
      type?: string;
      message?: string;
      error?: {
        message?: string;
        type?: string;
        code?: string;
        param?: string;
      };
      headers?: Record<string, string>;
    };

    console.error('Error details:', {
      status: err.status,
      code: err.error?.code || err.code,
      type: err.error?.type || err.type,
      message: err.error?.message || err.message,
      param: err.error?.param,
    });

    // Log rate limit headers if present
    if (err.headers) {
      const rateLimitHeaders = Object.entries(err.headers)
        .filter(([key]) => key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('retry'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      if (Object.keys(rateLimitHeaders).length > 0) {
        console.error('Rate limit headers:', rateLimitHeaders);
      }
    }
  } else {
    console.error('Raw error:', error);
  }

  console.error('=== End OpenAI Error ===\n');
}
