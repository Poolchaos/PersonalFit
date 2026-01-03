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
 * Query Key Factory
 *
 * Centralized query key management following the TanStack Query best practices.
 * This provides type-safe, hierarchical query keys that enable precise cache invalidation.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/community/lukemorales-query-key-factory
 */

export const queryKeys = {
  // All query keys start with their domain
  all: ['all'] as const,

  // Profile domain
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all] as const,
  },

  // Workouts domain
  workouts: {
    all: ['workouts'] as const,
    lists: () => [...queryKeys.workouts.all, 'list'] as const,
    list: (filters?: { active?: boolean }) =>
      [...queryKeys.workouts.lists(), filters] as const,
    details: () => [...queryKeys.workouts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workouts.details(), id] as const,
  },

  // Sessions domain
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: { status?: string; date?: string }) =>
      [...queryKeys.sessions.lists(), filters] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },

  // Gamification domain
  gamification: {
    all: ['gamification'] as const,
    stats: () => [...queryKeys.gamification.all, 'stats'] as const,
    achievements: () => [...queryKeys.gamification.all, 'achievements'] as const,
    leaderboard: () => [...queryKeys.gamification.all, 'leaderboard'] as const,
  },

  // Accountability domain
  accountability: {
    all: ['accountability'] as const,
    status: () => [...queryKeys.accountability.all, 'status'] as const,
    penalties: () => [...queryKeys.accountability.all, 'penalties'] as const,
  },

  // Equipment domain
  equipment: {
    all: ['equipment'] as const,
    lists: () => [...queryKeys.equipment.all, 'list'] as const,
    list: (filters?: { type?: string }) =>
      [...queryKeys.equipment.lists(), filters] as const,
    details: () => [...queryKeys.equipment.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.equipment.details(), id] as const,
  },

  // Metrics domain
  metrics: {
    all: ['metrics'] as const,
    lists: () => [...queryKeys.metrics.all, 'list'] as const,
    latest: () => [...queryKeys.metrics.all, 'latest'] as const,
    history: (range?: { start?: string; end?: string }) =>
      [...queryKeys.metrics.all, 'history', range] as const,
  },

  // AI Config domain
  aiConfig: {
    all: ['ai-config'] as const,
    detail: () => [...queryKeys.aiConfig.all] as const,
  },

  // Penalties domain (subset of accountability but often queried separately)
  penalties: {
    all: ['penalties'] as const,
    lists: () => [...queryKeys.penalties.all, 'list'] as const,
    list: (filters?: { completed?: boolean }) =>
      [...queryKeys.penalties.lists(), filters] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;

/**
 * Helper to invalidate all queries in a domain
 * Usage: invalidateQueries({ queryKey: queryKeys.workouts.all })
 */
export const invalidationKeys = {
  /** Invalidate all workout-related queries */
  workouts: queryKeys.workouts.all,
  /** Invalidate all session-related queries */
  sessions: queryKeys.sessions.all,
  /** Invalidate all gamification-related queries */
  gamification: queryKeys.gamification.all,
  /** Invalidate all accountability-related queries */
  accountability: queryKeys.accountability.all,
  /** Invalidate all profile-related queries */
  profile: queryKeys.profile.all,
  /** Invalidate all equipment-related queries */
  equipment: queryKeys.equipment.all,
  /** Invalidate all metrics-related queries */
  metrics: queryKeys.metrics.all,
} as const;
