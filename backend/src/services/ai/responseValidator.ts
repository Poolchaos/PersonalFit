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
 * Response Validator - Zod-based validation for AI outputs
 * Ensures AI responses conform to expected schemas with helpful error messages
 */

import { z, ZodError, ZodSchema } from 'zod';
import { WorkoutPlanSchema, WorkoutSessionSchema, ExerciseSchema } from './types';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  rawInput?: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  received?: unknown;
  expected?: string;
}

/**
 * Parse and validate JSON from AI response
 */
export function parseAIResponse<T>(
  response: string,
  schema: ZodSchema<T>
): ValidationResult<T> {
  // Try to extract JSON from markdown code blocks
  let jsonString = response;

  // Check for ```json ... ``` blocks
  const jsonBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    jsonString = jsonBlockMatch[1].trim();
  }

  // Try to find JSON object or array
  const jsonMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonString);
    return validateWithSchema(parsed, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: [{
          path: 'root',
          message: `Invalid JSON: ${error.message}`,
          code: 'invalid_json',
        }],
        rawInput: response,
      };
    }
    throw error;
  }
}

/**
 * Validate parsed data against schema
 */
export function validateWithSchema<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error),
        rawInput: data,
      };
    }
    throw error;
  }
}

/**
 * Safe parse that returns validation result without throwing
 */
export function safeParse<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
    rawInput: data,
  };
}

/**
 * Format Zod errors into user-friendly format
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
    received: 'received' in issue ? issue.received : undefined,
    expected: 'expected' in issue ? String(issue.expected) : undefined,
  }));
}

/**
 * Create validation error message for AI retry prompt
 */
export function createValidationErrorPrompt(errors: ValidationError[]): string {
  const errorList = errors.map(e =>
    `- ${e.path}: ${e.message}${e.expected ? ` (expected: ${e.expected})` : ''}`
  ).join('\n');

  return `The previous response had validation errors. Please fix the following issues and provide a valid response:\n\n${errorList}`;
}

/**
 * Validate workout plan with detailed error messages
 */
export function validateWorkoutPlan(data: unknown): ValidationResult<z.infer<typeof WorkoutPlanSchema>> {
  return validateWithSchema(data, WorkoutPlanSchema);
}

/**
 * Validate workout session
 */
export function validateWorkoutSession(data: unknown): ValidationResult<z.infer<typeof WorkoutSessionSchema>> {
  return validateWithSchema(data, WorkoutSessionSchema);
}

/**
 * Validate exercise
 */
export function validateExercise(data: unknown): ValidationResult<z.infer<typeof ExerciseSchema>> {
  return validateWithSchema(data, ExerciseSchema);
}

/**
 * Partial validation - validates what's present, ignores missing optional fields
 */
export function validatePartial<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<Partial<T>> {
  // Create a partial version of the schema
  if (schema instanceof z.ZodObject) {
    const partialSchema = schema.partial();
    return validateWithSchema(data, partialSchema as ZodSchema<Partial<T>>);
  }

  // For non-object schemas, just validate normally
  return validateWithSchema(data, schema) as ValidationResult<Partial<T>>;
}

/**
 * Coerce and validate - attempts to fix common issues before validation
 */
export function coerceAndValidate<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  if (typeof data !== 'object' || data === null) {
    return validateWithSchema(data, schema);
  }

  // Deep clone to avoid mutating original
  const coerced = JSON.parse(JSON.stringify(data));

  // Apply common coercions
  applyCoercions(coerced);

  return validateWithSchema(coerced, schema);
}

/**
 * Apply common coercions to fix AI response issues
 */
function applyCoercions(obj: Record<string, unknown>): void {
  for (const key in obj) {
    const value = obj[key];

    // Convert string numbers to numbers
    if (typeof value === 'string' && !isNaN(Number(value))) {
      const num = Number(value);
      if (Number.isInteger(num) && ['sets', 'reps', 'duration', 'restSeconds', 'dayOfWeek'].includes(key)) {
        obj[key] = num;
      }
    }

    // Convert single items to arrays
    if (key === 'equipment' || key === 'muscleGroups' || key === 'warmup' || key === 'cooldown') {
      if (value && !Array.isArray(value)) {
        obj[key] = [value];
      }
    }

    // Recursively process nested objects/arrays
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          applyCoercions(item as Record<string, unknown>);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      applyCoercions(value as Record<string, unknown>);
    }
  }
}

/**
 * Extract and validate multiple workout plans from response
 */
export function extractWorkoutPlans(response: string): ValidationResult<z.infer<typeof WorkoutPlanSchema>[]> {
  const plansSchema = z.array(WorkoutPlanSchema);

  // Try to parse as array first
  const arrayResult = parseAIResponse(response, plansSchema);
  if (arrayResult.success) {
    return arrayResult;
  }

  // Try as single plan wrapped in object with 'plans' key
  const wrappedSchema = z.object({ plans: plansSchema });
  const wrappedResult = parseAIResponse(response, wrappedSchema);
  if (wrappedResult.success && wrappedResult.data) {
    return {
      success: true,
      data: wrappedResult.data.plans,
    };
  }

  // Try as single plan
  const singleResult = parseAIResponse(response, WorkoutPlanSchema);
  if (singleResult.success && singleResult.data) {
    return {
      success: true,
      data: [singleResult.data],
    };
  }

  return {
    success: false,
    errors: [{
      path: 'root',
      message: 'Could not extract workout plans from response',
      code: 'extraction_failed',
    }],
    rawInput: response,
  };
}
