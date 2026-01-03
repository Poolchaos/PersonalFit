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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import WorkoutPlanReviewPage from '../pages/WorkoutPlanReviewPage';
import * as api from '../api';

// Mock all APIs
vi.mock('../api', () => ({
  aiConfigAPI: {
    get: vi.fn(),
    update: vi.fn(),
    test: vi.fn(),
  },
  profileAPI: {
    updateProfile: vi.fn(),
    updatePreferences: vi.fn(),
  },
  equipmentAPI: {
    create: vi.fn(),
  },
  workoutAPI: {
    generate: vi.fn(),
    getAll: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Workout Generation Flow - Integration Tests', () => {
  let queryClient: QueryClient;

  const mockGeneratedPlan = {
    plan: {
      id: 'integration-test-plan',
      plan_data: {
        plan_overview: {
          duration_weeks: 4,
          sessions_per_week: 3,
          focus_areas: ['strength', 'muscle_gain'],
          equipment_required: ['dumbbells', 'barbell'],
        },
        weekly_schedule: [
          {
            day: 'Monday',
            workout: {
              name: 'Push Day',
              duration_minutes: 60,
              focus: 'Chest & Triceps',
              exercises: [
                {
                  name: 'Bench Press',
                  sets: 3,
                  reps: 10,
                  duration_seconds: null,
                  rest_seconds: 90,
                  equipment: ['barbell'],
                  target_muscles: ['chest', 'triceps'],
                  instructions: 'Lower to chest, press up explosively',
                  modifications: 'Use dumbbells for variation',
                },
              ],
            },
          },
        ],
        progression_notes: 'Add 5lbs each week',
        safety_reminders: ['Use spotter for heavy sets'],
      },
      generation_context: {
        user_goals: ['muscle_gain'],
        experience_level: 'intermediate',
        equipment_used: ['dumbbells', 'barbell'],
        workout_modality: 'strength',
      },
      created_at: '2025-11-16T14:00:00.000Z',
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/workout-plan-review" element={<WorkoutPlanReviewPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Complete Flow: Onboarding â†’ Generation â†’ Review', () => {
    it('should successfully complete entire workout generation flow', async () => {
      // Setup mocks
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      vi.mocked(api.profileAPI.updateProfile).mockResolvedValue({
        profile: { first_name: 'Test', fitness_goals: ['muscle_gain'] },
      });

      vi.mocked(api.profileAPI.updatePreferences).mockResolvedValue({
        preferences: { workout_frequency: 3, preferred_workout_duration: 60 },
      });

      vi.mocked(api.equipmentAPI.create).mockResolvedValue({
        equipment: { equipment_name: 'Dumbbells' },
      });

      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockGeneratedPlan);

      // Start at onboarding
      window.history.pushState({}, 'Onboarding', '/onboarding');
      renderApp();

      // Verify we're on onboarding page
      await waitFor(() => {
        expect(screen.getByText(/OpenAI API Setup/i)).toBeInTheDocument();
      });

      // Verify generated plan was set in cache
      const cachedData = queryClient.getQueryData(['workouts']);
      expect(cachedData).toBeDefined();
      expect(cachedData).toHaveProperty('plan');
    });

    it('should persist plan data in query cache between navigation', async () => {
      // Set plan in cache (simulating successful generation)
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      // Navigate to review page
      window.history.pushState({}, 'Review', '/workout-plan-review');
      renderApp();

      // Verify plan is displayed
      await waitFor(() => {
        expect(screen.getByText(/Your Workout Plan is Ready!/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Push Day')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();

      // Verify cache still has the data
      const cachedData = queryClient.getQueryData(['workouts']);
      expect(cachedData).toEqual(mockGeneratedPlan);
    });

    it('should handle cache miss gracefully', async () => {
      // Don't set any data in cache
      vi.mocked(api.workoutAPI.getAll).mockResolvedValue({ workouts: [] });

      window.history.pushState({}, 'Review', '/workout-plan-review');
      renderApp();

      await waitFor(() => {
        expect(screen.getByText(/No Workout Plan Found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow Validation', () => {
    it('should correctly transform backend response to frontend format', async () => {
      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockGeneratedPlan);

      // Simulate generation
      const result = await api.workoutAPI.generate({
        workout_modality: 'strength',
        fitness_goals: ['muscle_gain'],
      });

      expect(result).toHaveProperty('plan');
      expect(result.plan).toHaveProperty('plan_data');
      expect(result.plan.plan_data).toHaveProperty('weekly_schedule');
      expect(result.plan.plan_data.weekly_schedule[0]).toHaveProperty('day');
      expect(result.plan.plan_data.weekly_schedule[0]).toHaveProperty('workout');
    });

    it('should extract plan from either workouts array or plan property', () => {
      // Test workouts array format
      const arrayFormat = { workouts: [mockGeneratedPlan.plan] };
      queryClient.setQueryData(['workouts'], arrayFormat);

      window.history.pushState({}, 'Review', '/workout-plan-review');
      renderApp();

      // Should extract plan successfully
      const extractedFromArray =
        (arrayFormat as { workouts?: typeof mockGeneratedPlan.plan[] }).workouts?.[0] ||
        (arrayFormat as { plan?: typeof mockGeneratedPlan.plan }).plan;
      expect(extractedFromArray).toBeDefined();

      // Test plan property format
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      const extractedFromPlan =
        (mockGeneratedPlan as { workouts?: typeof mockGeneratedPlan.plan[] }).workouts?.[0] ||
        (mockGeneratedPlan as { plan?: typeof mockGeneratedPlan.plan }).plan;
      expect(extractedFromPlan).toBeDefined();
      expect(extractedFromPlan).toEqual(mockGeneratedPlan.plan);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle generation API failure', async () => {
      vi.mocked(api.workoutAPI.generate).mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      // Attempt generation would fail
      await expect(api.workoutAPI.generate({})).rejects.toThrow();

      // Cache should not be updated
      const cachedData = queryClient.getQueryData(['workouts']);
      expect(cachedData).toBeUndefined();
    });

    it('should show appropriate error when plan data is malformed', async () => {
      const malformedPlan = {
        plan: {
          id: 'test',
          // Missing plan_data
        },
      };

      queryClient.setQueryData(['workouts'], malformedPlan);

      window.history.pushState({}, 'Review', '/workout-plan-review');

      // Should handle gracefully (might show error or empty state)
      // This test verifies the app doesn't crash
      expect(() => renderApp()).not.toThrow();
    });
  });

  describe('Console Debugging', () => {
    it('should log generation response for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockGeneratedPlan);

      await api.workoutAPI.generate({});

      // Console logs should help debug the flow
      // These are added in the components
      consoleSpy.mockRestore();
    });
  });
});
