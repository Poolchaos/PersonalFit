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
  HabitLog,
  HabitEntry,
  VisionScan,
  VisionItem,
  NutritionEvent,
  NutritionItem,
  HealthScore,
} from '../types';

export const healthEcosystemAPI = {
  // Habit Logs
  upsertHabitLog: async (log_date: string, entries: HabitEntry[]): Promise<{ habitLog: HabitLog }> => {
    const { data } = await apiClient.post('/api/habits', { log_date, entries });
    return data;
  },

  getHabitLogs: async (params?: {
    from_date?: string;
    to_date?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ logs: HabitLog[]; pagination: { total: number; limit: number; skip: number; has_more: boolean } }> => {
    const { data } = await apiClient.get('/api/habits', { params });
    return data;
  },

  // Vision Scans
  uploadVisionImage: async (input: { source: 'fridge' | 'grocery' | 'receipt'; file: File }) => {
    const formData = new FormData();
    formData.append('image', input.file);
    formData.append('source', input.source);

    const { data } = await apiClient.post('/api/vision/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { image: { url: string; filename: string; source: string } };
  },

  createVisionScan: async (input: {
    source: 'fridge' | 'grocery' | 'receipt';
    image_url: string;
    items?: VisionItem[];
    status?: 'pending' | 'confirmed' | 'failed';
    processed_at?: string;
  }): Promise<{ scan: VisionScan }> => {
    const { data } = await apiClient.post('/api/vision/scans', input);
    return data;
  },

  getVisionScans: async (params?: {
    limit?: number;
    skip?: number;
  }): Promise<{ scans: VisionScan[]; pagination: { total: number; limit: number; skip: number; has_more: boolean } }> => {
    const { data } = await apiClient.get('/api/vision/scans', { params });
    return data;
  },

  updateVisionScan: async (
    id: string,
    input: Partial<Pick<VisionScan, 'items' | 'status' | 'processed_at'>>
  ): Promise<{ scan: VisionScan }> => {
    const { data } = await apiClient.put(`/api/vision/scans/${id}`, input);
    return data;
  },

  analyzeVisionScan: async (
    id: string,
    provider?: 'anthropic' | 'openai'
  ): Promise<{ scan: VisionScan; analysis: { total_items_detected: number; provider: string } }> => {
    const { data } = await apiClient.post(`/api/vision/scans/${id}/analyze`, { provider });
    return data;
  },

  generateMealSuggestions: async (
    id: string,
    dietaryPreferences?: string[],
    provider?: 'anthropic' | 'openai'
  ): Promise<{ meal_suggestions: string[]; based_on_items: number }> => {
    const { data } = await apiClient.post(`/api/vision/scans/${id}/meal-suggestions`, {
      dietary_preferences: dietaryPreferences,
      provider,
    });
    return data;
  },

  // Nutrition Events
  createNutritionEvent: async (input: {
    source: 'vision' | 'manual' | 'meal_plan';
    consumed_at: string;
    meal_title?: string;
    calories?: number;
    macros?: { protein_g?: number; carbs_g?: number; fat_g?: number };
    items?: NutritionItem[];
  }): Promise<{ event: NutritionEvent }> => {
    const { data } = await apiClient.post('/api/nutrition/events', input);
    return data;
  },

  getNutritionEvents: async (params?: {
    from_date?: string;
    to_date?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ events: NutritionEvent[]; pagination: { total: number; limit: number; skip: number; has_more: boolean } }> => {
    const { data } = await apiClient.get('/api/nutrition/events', { params });
    return data;
  },

  deleteNutritionEvent: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/nutrition/events/${id}`);
    return data;
  },

  // Health Scores
  upsertHealthScore: async (input: {
    score_date: string;
    total_score: number;
    pillars?: HealthScore['pillars'];
    reasons?: string[];
  }): Promise<{ score: HealthScore }> => {
    const { data } = await apiClient.post('/api/health-scores', input);
    return data;
  },

  getHealthScores: async (params?: {
    from_date?: string;
    to_date?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ scores: HealthScore[]; pagination: { total: number; limit: number; skip: number; has_more: boolean } }> => {
    const { data } = await apiClient.get('/api/health-scores', { params });
    return data;
  },
};

export const healthEcosystemQueryKeys = {
  habits: ['habits'] as const,
  habitRange: (from_date?: string, to_date?: string) =>
    [...healthEcosystemQueryKeys.habits, { from_date, to_date }] as const,
  visionScans: ['vision_scans'] as const,
  nutritionEvents: ['nutrition_events'] as const,
  healthScores: ['health_scores'] as const,
};
