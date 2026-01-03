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
 * AI Types - Type definitions for the AI orchestration layer
 */

import { z } from 'zod';

// ============================================
// Message Types
// ============================================

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestConfig {
  model: string;
  provider: AIProvider;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  latencyMs: number;
  cached?: boolean;
}

// ============================================
// Agent Types
// ============================================

export type AgentRole = 'planner' | 'worker' | 'reviewer' | 'orchestrator';

export interface AgentContext {
  userId: string;
  sessionId: string;
  taskId: string;
  attempt: number;
  previousAttempts: AgentAttempt[];
  metadata: Record<string, unknown>;
}

export interface AgentAttempt {
  agentRole: AgentRole;
  input: string;
  output: string;
  error?: string;
  timestamp: Date;
  latencyMs: number;
  tokensUsed: number;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
  attempts: AgentAttempt[];
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
}

// ============================================
// Workout Generation Types
// ============================================

export const ExerciseSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['strength', 'cardio', 'flexibility', 'balance', 'hiit']),
  sets: z.number().int().positive().optional(),
  reps: z.union([z.number().int().positive(), z.string()]).optional(),
  duration: z.string().optional(),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  muscleGroups: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const WorkoutSessionSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  sessionType: z.enum(['strength', 'cardio', 'hiit', 'flexibility', 'mixed', 'rest']),
  duration: z.number().int().positive(),
  warmup: z.array(ExerciseSchema).optional(),
  mainWorkout: z.array(ExerciseSchema),
  cooldown: z.array(ExerciseSchema).optional(),
  notes: z.string().optional(),
  calorieEstimate: z.number().int().nonnegative().optional(),
});

export const WorkoutPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  goal: z.string(),
  durationWeeks: z.number().int().min(1).max(52),
  sessionsPerWeek: z.number().int().min(1).max(7),
  sessions: z.array(WorkoutSessionSchema),
  progressionNotes: z.string().optional(),
  adaptations: z.record(z.string(), z.string()).optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

// ============================================
// Orchestration Types
// ============================================

export interface OrchestrationPlan {
  taskId: string;
  steps: OrchestrationStep[];
  estimatedTokens: number;
  estimatedCost: number;
  priority: 'low' | 'normal' | 'high';
}

export interface OrchestrationStep {
  stepId: string;
  agentRole: AgentRole;
  action: string;
  input: Record<string, unknown>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  retryableErrors: string[];
  modelFallbackOrder: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  retryableErrors: [
    'rate_limit_exceeded',
    'timeout',
    'server_error',
    'overloaded',
    'ECONNRESET',
    'ETIMEDOUT',
  ],
  modelFallbackOrder: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022',
  ],
};

// ============================================
// Streaming Types
// ============================================

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type StreamCallback = (chunk: StreamChunk) => void;

// ============================================
// Cache Types
// ============================================

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  tokensUsed: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  maxEntries: number;
  maxMemoryMB: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttlSeconds: 3600, // 1 hour
  maxEntries: 1000,
  maxMemoryMB: 100,
};
