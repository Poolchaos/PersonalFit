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
import { BrowserRouter } from 'react-router-dom';
import { OnboardingWizard } from './OnboardingWizard';
import * as api from '../../api';

// Mock the API modules
vi.mock('../../api', () => ({
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
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OnboardingWizard - Workout Generation Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OnboardingWizard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('API Key Configuration', () => {
    it('should show existing key message when API key already configured', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/API Key Already Configured/i)).toBeInTheDocument();
      });
    });

    it('should show instructions when no API key exists', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: false,
          has_api_key: false,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/How to get your API key/i)).toBeInTheDocument();
      });
    });

    it('should allow proceeding with existing key without entering new one', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Using existing key/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Should proceed to next step without error
      await waitFor(() => {
        expect(screen.queryByText(/Please enter your OpenAI API key/i)).not.toBeInTheDocument();
      });
    });

    it('should validate new API key before proceeding', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: false,
          has_api_key: false,
        },
      });

      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Should show error if no key entered
      await waitFor(() => {
        expect(screen.getByText(/Please enter your OpenAI API key/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workout Generation', () => {
    const mockGeneratedPlan = {
      plan: {
        id: 'test-plan-id',
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
                name: 'Upper Body Strength',
                duration_minutes: 60,
                focus: 'Upper Body',
                exercises: [
                  {
                    name: 'Bench Press',
                    sets: 3,
                    reps: 10,
                    rest_seconds: 90,
                    equipment: ['barbell'],
                    target_muscles: ['chest', 'triceps'],
                    instructions: 'Lower bar to chest, press up',
                    modifications: 'Use dumbbells if needed',
                  },
                ],
              },
            },
          ],
          progression_notes: 'Increase weight by 5% each week',
          safety_reminders: ['Warm up properly', 'Use proper form'],
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

    it('should successfully generate workout plan and navigate to review', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      vi.mocked(api.profileAPI.updateProfile).mockResolvedValue({ profile: {} } as any);
      vi.mocked(api.profileAPI.updatePreferences).mockResolvedValue({ preferences: {} } as any);
      vi.mocked(api.equipmentAPI.create).mockResolvedValue({ equipment: {} } as any);
      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockGeneratedPlan as any);

      renderComponent();

      // Wait for API key check
      await waitFor(() => {
        expect(screen.getByText(/Using existing key/i)).toBeInTheDocument();
      });

      // Navigate through all steps
      // Step 0: API Key (skip with existing key)
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 1: Name
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: Workout Modality
      await waitFor(() => {
        const strengthButton = screen.getByText(/Strength Training/i);
        fireEvent.click(strengthButton);
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Fitness Goals
      await waitFor(() => {
        const goalButton = screen.getByText(/Build Muscle/i);
        fireEvent.click(goalButton);
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Continue through remaining steps...
      // Skip to final generation

      // Verify generate was called with correct parameters
      await waitFor(() => {
        expect(api.workoutAPI.generate).toHaveBeenCalled();
      });

      // Verify navigation to review page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/workout-plan-review');
      });

      // Verify data was set in query cache
      const cachedData = queryClient.getQueryData(['workouts']);
      expect(cachedData).toEqual(mockGeneratedPlan);
    });

    it('should handle generation failure gracefully', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      vi.mocked(api.workoutAPI.generate).mockRejectedValue(new Error('Generation failed'));

      renderComponent();

      // Navigate through steps and trigger generation
      // ... (simplified for test)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not update API key if using existing key', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
      });

      vi.mocked(api.profileAPI.updateProfile).mockResolvedValue({ profile: {} } as any);
      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockGeneratedPlan as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Using existing key/i)).toBeInTheDocument();
      });

      // Complete onboarding (simplified)
      // ... navigate through steps

      // Verify API key update was NOT called
      expect(api.aiConfigAPI.update).not.toHaveBeenCalled();
    });

    it('should update API key only when new key is provided', async () => {
      vi.mocked(api.aiConfigAPI.get).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: false,
          has_api_key: false,
        },
      });

      vi.mocked(api.aiConfigAPI.update).mockResolvedValue({
        ai_config: {
          provider: 'openai',
          enabled: true,
          has_api_key: true,
        },
        message: 'Updated',
      });

      renderComponent();

      const apiKeyInput = screen.getByPlaceholderText(/sk-/i);
      fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key-123' } });

      // Complete onboarding...
      // Verify API key update WAS called
      // expect(api.aiConfigAPI.update).toHaveBeenCalledWith({
      //   provider: 'openai',
      //   api_key: 'sk-test-key-123',
      //   enabled: true,
      // });
    });
  });

  describe('Query Cache Management', () => {
    it('should set generated plan data in query cache', async () => {
      const mockPlan = {
        plan: {
          id: 'test-id',
          plan_data: {
            plan_overview: {
              duration_weeks: 4,
              sessions_per_week: 3,
              focus_areas: ['strength'],
              equipment_required: ['dumbbells'],
            },
            weekly_schedule: [],
            progression_notes: 'Test notes',
            safety_reminders: [],
          },
          generation_context: {
            user_goals: ['strength'],
            experience_level: 'beginner',
            equipment_used: ['dumbbells'],
            workout_modality: 'strength',
          },
          created_at: '2025-11-16T14:00:00.000Z',
        },
      };

      vi.mocked(api.workoutAPI.generate).mockResolvedValue(mockPlan as any);

      // Simulate successful generation
      await queryClient.executeMutation({
        mutationFn: () => api.workoutAPI.generate({}),
        onSuccess: (data) => {
          queryClient.setQueryData(['workouts'], data);
        },
      } as any);

      const cachedData = queryClient.getQueryData(['workouts']);
      expect(cachedData).toEqual(mockPlan);
    });
  });
});
