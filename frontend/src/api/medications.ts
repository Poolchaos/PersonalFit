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
  Medication,
  DoseLog,
  TodaysMedication,
  AdherenceStats,
  CreateMedicationInput,
  LogDoseInput,
} from '../types';

export const medicationAPI = {
  // Get all medications
  getAll: async (activeOnly = true): Promise<{ medications: Medication[] }> => {
    const { data } = await apiClient.get('/api/medications', {
      params: { active: activeOnly },
    });
    return data;
  },

  // Get single medication
  getById: async (id: string): Promise<{ medication: Medication }> => {
    const { data } = await apiClient.get(`/api/medications/${id}`);
    return data;
  },

  // Create medication
  create: async (input: CreateMedicationInput): Promise<{ medication: Medication }> => {
    const { data } = await apiClient.post('/api/medications', input);
    return data;
  },

  // Update medication
  update: async (
    id: string,
    input: Partial<CreateMedicationInput> & { is_active?: boolean }
  ): Promise<{ medication: Medication }> => {
    const { data } = await apiClient.put(`/api/medications/${id}`, input);
    return data;
  },

  // Delete medication (soft delete by default)
  delete: async (id: string, permanent = false): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/medications/${id}`, {
      params: { permanent },
    });
    return data;
  },

  // Get today's doses for all medications
  getTodaysDoses: async (): Promise<{ todaysDoses: TodaysMedication[] }> => {
    const { data } = await apiClient.get('/api/medications/today');
    return data;
  },

  // Log a dose
  logDose: async (
    medicationId: string,
    input: LogDoseInput
  ): Promise<{ doseLog: DoseLog }> => {
    const { data } = await apiClient.post(
      `/api/medications/${medicationId}/doses`,
      input
    );
    return data;
  },

  // Get dose logs for a medication
  getDoseLogs: async (
    medicationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ logs: DoseLog[] }> => {
    const { data } = await apiClient.get(`/api/medications/${medicationId}/doses`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return data;
  },

  // Get adherence stats
  getAdherenceStats: async (
    medicationId: string,
    days = 30
  ): Promise<{ stats: AdherenceStats }> => {
    const { data } = await apiClient.get(`/api/medications/${medicationId}/stats`, {
      params: { days },
    });
    return data;
  },

  // Get medications needing refill
  getNeedingRefill: async (): Promise<{ medications: Medication[] }> => {
    const { data } = await apiClient.get('/api/medications/refills');
    return data;
  },

  // Refill medication
  refill: async (
    id: string,
    count: number
  ): Promise<{ medication: Medication }> => {
    const { data } = await apiClient.post(`/api/medications/${id}/refill`, {
      count,
    });
    return data;
  },

  // Get correlation insights
  getCorrelations: async (): Promise<{ data: any[] }> => {
    const { data } = await apiClient.get('/api/medications/correlations');
    return data;
  },

  // Trigger correlation analysis
  triggerAnalysis: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/api/medications/correlations/analyze');
    return data;
  },
};

// Query keys for React Query
export const medicationQueryKeys = {
  all: ['medications'] as const,
  list: (activeOnly?: boolean) => [...medicationQueryKeys.all, 'list', { activeOnly }] as const,
  detail: (id: string) => [...medicationQueryKeys.all, 'detail', id] as const,
  today: () => [...medicationQueryKeys.all, 'today'] as const,
  refills: () => [...medicationQueryKeys.all, 'refills'] as const,
  logs: (id: string, startDate?: string, endDate?: string) =>
    [...medicationQueryKeys.all, 'logs', id, { startDate, endDate }] as const,
  stats: (id: string, days?: number) =>
    [...medicationQueryKeys.all, 'stats', id, { days }] as const,
  correlations: () => [...medicationQueryKeys.all, 'correlations'] as const,
};
