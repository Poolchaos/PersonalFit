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
import WorkoutPlanReviewPage from './WorkoutPlanReviewPage';
import * as api from '../api';

// Mock the API
vi.mock('../api', () => ({
  workoutAPI: {
    getAll: vi.fn(),
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

describe('WorkoutPlanReviewPage', () => {
  let queryClient: QueryClient;

  const mockGeneratedPlan = {
    plan: {
      id: '6919d98279b7e96cda285de7',
      plan_data: {
        plan_overview: {
          duration_weeks: 4,
          sessions_per_week: 4,
          focus_areas: ['weight_loss', 'endurance'],
          equipment_required: ['dumbbells', 'resistance bands', 'kettlebells', 'jump rope'],
        },
        weekly_schedule: [
          {
            day: 'Monday',
            workout: {
              name: 'Steady-State Cardio & Core',
              duration_minutes: 60,
              focus: 'Cardiovascular Endurance',
              exercises: [
                {
                  name: 'Brisk Walking',
                  sets: 1,
                  reps: null,
                  duration_seconds: 1800,
                  rest_seconds: null,
                  equipment: ['none'],
                  target_muscles: ['cardiovascular system'],
                  instructions: 'Maintain steady pace, keep heart rate in zone 2-3',
                  modifications: 'Increase speed for more intensity',
                },
                {
                  name: 'Plank',
                  sets: 3,
                  reps: null,
                  duration_seconds: 30,
                  rest_seconds: 60,
                  equipment: ['none'],
                  target_muscles: ['core'],
                  instructions: 'Keep body straight from head to heels',
                  modifications: 'Drop knees for easier version',
                },
              ],
            },
          },
          {
            day: 'Wednesday',
            workout: {
              name: 'Interval Training',
              duration_minutes: 45,
              focus: 'HIIT',
              exercises: [
                {
                  name: 'Jump Rope Intervals',
                  sets: 10,
                  reps: null,
                  duration_seconds: 60,
                  rest_seconds: 60,
                  equipment: ['jump rope'],
                  target_muscles: ['cardiovascular system', 'calves'],
                  instructions: 'Jump at moderate pace',
                  modifications: 'Do jumping jacks if no rope',
                },
              ],
            },
          },
        ],
        progression_notes: 'Increase duration by 5-10% each week',
        safety_reminders: ['Warm up properly', 'Stay hydrated', 'Listen to your body'],
      },
      generation_context: {
        user_goals: ['weight_loss', 'endurance'],
        experience_level: 'beginner',
        equipment_used: ['Dumbbells', 'Jump Rope'],
        workout_modality: 'cardio',
      },
      created_at: '2025-11-16T14:02:42.659Z',
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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WorkoutPlanReviewPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      vi.mocked(api.workoutAPI.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText(/Loading your workout plan/i)).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Sparkles icon
    });
  });

  describe('No Plan Found', () => {
    it('should show error message when no plan exists', async () => {
      vi.mocked(api.workoutAPI.getAll).mockResolvedValue({ workouts: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No Workout Plan Found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/We couldn't find your generated workout plan/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to Workouts/i })).toBeInTheDocument();
    });

    it('should navigate to workouts page when clicking button', async () => {
      vi.mocked(api.workoutAPI.getAll).mockResolvedValue({ workouts: [] });

      renderComponent();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Go to Workouts/i });
        fireEvent.click(button);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/workouts');
    });
  });

  describe('Plan Display', () => {
    it('should display plan when data is in cache', async () => {
      // Simulate data being set in cache by OnboardingWizard
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your Workout Plan is Ready!/i)).toBeInTheDocument();
      });

      // Check hero stats
      expect(screen.getByText('53')).toBeInTheDocument(); // avg duration
      expect(screen.getByText('12')).toBeInTheDocument(); // total exercises (1+1 from mock)
    });

    it('should display weekly schedule correctly', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
      });

      expect(screen.getByText('Steady-State Cardio & Core')).toBeInTheDocument();
      expect(screen.getByText('Interval Training')).toBeInTheDocument();
    });

    it('should display exercises with correct details', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Brisk Walking')).toBeInTheDocument();
      });

      expect(screen.getByText('Plank')).toBeInTheDocument();
      expect(screen.getByText('Jump Rope Intervals')).toBeInTheDocument();

      // Check exercise details
      expect(screen.getByText(/1800s/i)).toBeInTheDocument(); // duration
      expect(screen.getByText(/30s/i)).toBeInTheDocument(); // plank duration
    });

    it('should display muscle groups as tags', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('cardiovascular system')).toBeInTheDocument();
      });

      expect(screen.getByText('core')).toBeInTheDocument();
      expect(screen.getByText('calves')).toBeInTheDocument();
    });

    it('should display plan overview correctly', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/4 weeks/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/4x per week/i)).toBeInTheDocument();
      expect(screen.getByText('weight_loss')).toBeInTheDocument();
      expect(screen.getByText('endurance')).toBeInTheDocument();
    });

    it('should display progression notes and safety reminders', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Increase duration by 5-10% each week/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Warm up properly/i)).toBeInTheDocument();
      expect(screen.getByText(/Stay hydrated/i)).toBeInTheDocument();
      expect(screen.getByText(/Listen to your body/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);
    });

    it('should navigate to dashboard when accepting plan', async () => {
      renderComponent();

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /Accept & Start Journey/i });
        fireEvent.click(acceptButton);
      });

      // Should show success animation
      await waitFor(() => {
        expect(screen.getByText(/Plan Accepted!/i)).toBeInTheDocument();
      });

      // Should navigate after delay
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        },
        { timeout: 2000 }
      );
    });

    it('should navigate to edit page when customizing', async () => {
      renderComponent();

      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /Customize Plan/i });
        fireEvent.click(customizeButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        `/workouts/${mockGeneratedPlan.plan.id}/edit`
      );
    });

    it('should navigate to onboarding when regenerating', async () => {
      renderComponent();

      await waitFor(() => {
        const regenerateButton = screen.getByRole('button', { name: /Generate New Plan/i });
        fireEvent.click(regenerateButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });

  describe('Data Structure Handling', () => {
    it('should handle plan from workouts array', async () => {
      vi.mocked(api.workoutAPI.getAll).mockResolvedValue({
        workouts: [mockGeneratedPlan.plan],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your Workout Plan is Ready!/i)).toBeInTheDocument();
      });
    });

    it('should handle plan directly from cache', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your Workout Plan is Ready!/i)).toBeInTheDocument();
      });
    });

    it('should calculate stats correctly', async () => {
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        // Total exercises: 2 from Monday + 1 from Wednesday = 3
        const totalExercises = screen.getByText('3');
        expect(totalExercises).toBeInTheDocument();

        // XP: 3 exercises * 10 = 30
        const xp = screen.getByText('30');
        expect(xp).toBeInTheDocument();

        // Unique muscles: cardiovascular system, core, calves = 3
        const uniqueMuscles = screen.getByText('3');
        expect(uniqueMuscles).toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    it('should log data for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      queryClient.setQueryData(['workouts'], mockGeneratedPlan);

      renderComponent();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'WorkoutPlanReviewPage - Raw data:',
          mockGeneratedPlan
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          'WorkoutPlanReviewPage - Extracted plan:',
          mockGeneratedPlan.plan
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
