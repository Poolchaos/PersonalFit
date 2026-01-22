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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { workoutAPI } from '../api';
import { getEmptyStateImage } from '../utils/imageHelpers';
import { Card, Button, WorkoutCardSkeleton, ConfirmModal } from '../design-system';
import { Dumbbell, Zap, Clock, TrendingUp, Play, Trash2, CheckCircle, Circle } from 'lucide-react';

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    planId: string;
    planName: string;
    isActive: boolean;
  }>({
    isOpen: false,
    planId: '',
    planName: '',
    isActive: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const generateMutation = useMutation({
    mutationFn: workoutAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('AI workout generated successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string }; status?: number } };
      console.error('Workout generation error:', error);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('profile')) {
        toast.error('Please complete your profile first');
        navigate('/onboarding');
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to generate workout. Please try again or complete your profile setup.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workoutAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout plan deleted successfully');
      setDeleteModal({ isOpen: false, planId: '', planName: '', isActive: false });
    },
    onError: () => {
      toast.error('Failed to delete workout plan');
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => workoutAPI.setActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout plan activated!');
    },
    onError: () => {
      toast.error('Failed to activate workout plan');
    },
  });

  const handleDelete = (planId: string, planName: string, isActive: boolean) => {
    if (isActive) {
      toast.error('Cannot delete active plan. Please deactivate it first.');
      return;
    }

    setDeleteModal({
      isOpen: true,
      planId,
      planName,
      isActive,
    });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.planId);
  };

  const handleSetActive = (planId: string) => {
    setActiveMutation.mutate(planId);
  };

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900">Workouts</h1>
          </div>
          <Button
            onClick={() => generateMutation.mutate({})}
            loading={generateMutation.isPending}
            variant="success"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate AI Workout
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <>
              <WorkoutCardSkeleton />
              <WorkoutCardSkeleton />
              <WorkoutCardSkeleton />
            </>
          )}

          {isError && (
            <Card className="border-error-light bg-error-light/10">
              <div className="p-6 text-center text-error-DEFAULT">
                Failed to load workouts. Please try again.
              </div>
            </Card>
          )}

          {!isLoading && !isError && data?.workouts && data.workouts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.workouts.map((plan) => {
                const planOverview = plan.plan_data?.plan_overview;
                const weeklySchedule = plan.plan_data?.weekly_schedule || [];
                const planName = planOverview?.program_name || 'Workout Plan';

                return (
                  <Card
                    key={plan._id}
                    hover
                    className={`relative ${plan.is_active ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <div className="p-6">
                      {/* Header with Title and Badges */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-neutral-900 flex-1 pr-2">
                            {planName}
                          </h3>
                          {plan.is_active && (
                            <div className="flex items-center gap-1 text-xs bg-primary-500 text-white px-2 py-1 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <span className="flex items-center gap-1 bg-success-light/20 text-success-dark px-2 py-1 rounded-full">
                            <Zap className="w-3 h-3" />
                            AI Generated
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {planOverview?.program_description && (
                        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                          {planOverview.program_description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap gap-3 text-sm text-neutral-600 mb-4 pb-4 border-b border-neutral-200">
                        {planOverview?.duration_weeks && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary-500" />
                            {planOverview.duration_weeks} weeks
                          </span>
                        )}
                        {planOverview?.sessions_per_week && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-primary-500" />
                            {planOverview.sessions_per_week}x/week
                          </span>
                        )}
                        {weeklySchedule.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-4 h-4 text-primary-500" />
                            {weeklySchedule.length} days
                          </span>
                        )}
                      </div>

                      {/* Quick Preview */}
                      {weeklySchedule.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                            This Week
                          </h4>
                          <div className="space-y-1.5">
                            {weeklySchedule.slice(0, 2).map((daySchedule, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm bg-neutral-50 px-3 py-2 rounded-lg"
                              >
                                <span className="font-medium text-neutral-700">{daySchedule.day}</span>
                                <span className="text-xs text-neutral-600 truncate ml-2">
                                  {daySchedule.workout?.name || 'Rest'}
                                </span>
                              </div>
                            ))}
                            {weeklySchedule.length > 2 && (
                              <p className="text-xs text-neutral-500 text-center pt-1">
                                +{weeklySchedule.length - 2} more days
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/workout-plan-review?plan=${plan._id}`)}
                          variant="primary"
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          View Full Plan
                        </Button>

                        <div className="flex gap-2">
                          {!plan.is_active ? (
                            <Button
                              onClick={() => handleSetActive(plan._id)}
                              variant="outline"
                              className="flex-1"
                              loading={setActiveMutation.isPending}
                            >
                              <Circle className="w-4 h-4 mr-2" />
                              Set Active
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="flex-1"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Currently Active
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDelete(plan._id, planName, plan.is_active)}
                            variant="outline"
                            className="text-error-DEFAULT hover:bg-error-light hover:border-error-DEFAULT"
                            loading={deleteMutation.isPending}
                            disabled={plan.is_active}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            !isLoading && !isError && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <img
                    src={getEmptyStateImage('no-workouts')}
                    alt="No workouts"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-12 text-center relative z-10">
                  <Dumbbell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">No workouts yet</h3>
                  <p className="text-neutral-500 mb-4">Generate your first AI-powered workout to get started!</p>
                  <Button
                    onClick={() => generateMutation.mutate({})}
                    loading={generateMutation.isPending}
                    variant="primary"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Generate AI Workout
                  </Button>
                </div>
              </Card>
            )
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, planId: '', planName: '', isActive: false })}
          onConfirm={confirmDelete}
          title="Delete Workout Plan"
          message={`Are you sure you want to delete "${deleteModal.planName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleteMutation.isPending}
        />
        </div>
      </PageTransition>
    </Layout>
  );
}
