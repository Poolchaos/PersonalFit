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

import { z } from 'zod';

/**
 * Reusable form validation schemas using Zod
 * These schemas provide type-safe validation with descriptive error messages
 */

// Common field validators
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Profile schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z
    .number()
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age')
    .optional(),
  height: z
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Please enter a valid height')
    .optional(),
  weight: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Please enter a valid weight')
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

// Metrics schemas
export const metricsSchema = z.object({
  weight: z
    .number()
    .min(20, 'Weight must be at least 20')
    .max(500, 'Weight must be less than 500')
    .optional(),
  bodyFat: z
    .number()
    .min(1, 'Body fat must be at least 1%')
    .max(70, 'Body fat must be less than 70%')
    .optional(),
  muscleMass: z
    .number()
    .min(10, 'Muscle mass must be at least 10 kg')
    .max(150, 'Muscle mass must be less than 150 kg')
    .optional(),
});

// Equipment schemas
export const equipmentItemSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  category: z.enum(['cardio', 'strength', 'flexibility', 'other']),
  available: z.boolean(),
  specifications: z
    .object({
      maxWeight: z.number().optional(),
      resistanceLevels: z.number().optional(),
      inclineRange: z.string().optional(),
    })
    .optional(),
});

// Goal schemas
export const goalSchema = z.object({
  title: z.string().min(3, 'Goal title must be at least 3 characters'),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  targetValue: z.number().positive('Target value must be positive').optional(),
  currentValue: z.number().optional(),
});

// API Key schema
export const apiKeySchema = z.object({
  openaiKey: z
    .string()
    .min(1, 'OpenAI API key is required')
    .regex(/^sk-/, 'API key must start with "sk-"'),
});

// Workout session schemas
export const exerciseLogSchema = z.object({
  sets: z.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  reps: z.number().min(1, 'At least 1 rep required').max(100, 'Maximum 100 reps'),
  weight: z.number().min(0, 'Weight cannot be negative').optional(),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

// Accountability partner schemas
export const partnerInviteSchema = z.object({
  email: emailSchema,
  message: z.string().max(500, 'Message must be under 500 characters').optional(),
});

// Export types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type MetricsFormData = z.infer<typeof metricsSchema>;
export type EquipmentItemFormData = z.infer<typeof equipmentItemSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type ApiKeyFormData = z.infer<typeof apiKeySchema>;
export type ExerciseLogFormData = z.infer<typeof exerciseLogSchema>;
export type PartnerInviteFormData = z.infer<typeof partnerInviteSchema>;
