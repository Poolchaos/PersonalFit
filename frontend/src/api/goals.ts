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

import { apiClient } from './client';
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalStats,
  GoalStatus,
  GoalCategory,
} from '../types/goals';

export const goalsAPI = {
  /**
   * Get all goals for the authenticated user
   */
  getAll: async (filters?: { status?: GoalStatus; category?: GoalCategory }): Promise<{ goals: Goal[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);

    const { data } = await apiClient.get(`/api/goals?${params.toString()}`);
    return data;
  },

  /**
   * Get a single goal by ID
   */
  getById: async (id: string): Promise<{ goal: Goal }> => {
    const { data } = await apiClient.get(`/api/goals/${id}`);
    return data;
  },

  /**
   * Create a new goal
   */
  create: async (goalData: CreateGoalInput): Promise<{ goal: Goal }> => {
    const { data } = await apiClient.post('/api/goals', goalData);
    return data;
  },

  /**
   * Update a goal (full update)
   */
  update: async (id: string, updates: UpdateGoalInput): Promise<{ goal: Goal }> => {
    const { data } = await apiClient.put(`/api/goals/${id}`, updates);
    return data;
  },

  /**
   * Update goal progress (current value)
   */
  updateProgress: async (id: string, current_value: number): Promise<{ goal: Goal }> => {
    const { data} = await apiClient.patch(`/api/goals/${id}/progress`, { current_value });
    return data;
  },

  /**
   * Update goal status
   */
  updateStatus: async (id: string, status: GoalStatus): Promise<{ goal: Goal }> => {
    const { data } = await apiClient.patch(`/api/goals/${id}/status`, { status });
    return data;
  },

  /**
   * Delete a goal
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/goals/${id}`);
    return data;
  },

  /**
   * Get goal statistics
   */
  getStats: async (): Promise<{ stats: GoalStats }> => {
    const { data } = await apiClient.get('/api/goals/stats');
    return data;
  },
};

/**
 * Query keys for React Query
 */
export const goalsQueryKeys = {
  all: ['goals'] as const,
  lists: () => [...goalsQueryKeys.all, 'list'] as const,
  list: (filters?: { status?: GoalStatus; category?: GoalCategory }) =>
    [...goalsQueryKeys.lists(), filters] as const,
  details: () => [...goalsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalsQueryKeys.details(), id] as const,
  stats: () => [...goalsQueryKeys.all, 'stats'] as const,
};
