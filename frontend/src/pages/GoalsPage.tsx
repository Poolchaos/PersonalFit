/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle2,
  PartyPopper,
  Clock,
  Pause,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { goalsAPI, goalsQueryKeys } from '../api';
import { PageTransition } from '../components/layout/PageTransition';
import type { Goal, CreateGoalInput } from '../types/goals';

// Goal templates for quick creation
const GOAL_TEMPLATES = [
  {
    name: 'Lose Weight',
    type: 'decrease' as const,
    category: 'weight_loss' as const,
    unit: 'kg',
    icon: TrendingDown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'Gain Muscle',
    type: 'increase' as const,
    category: 'muscle_gain' as const,
    unit: 'kg',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Increase Strength',
    type: 'increase' as const,
    category: 'strength' as const,
    unit: 'kg',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Complete 100 Workouts',
    type: 'accumulate' as const,
    category: 'workout_frequency' as const,
    unit: 'workouts',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Run 5K under 25min',
    type: 'target' as const,
    category: 'endurance' as const,
    unit: 'minutes',
    icon: Target,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateGoalInput>>({});
  const [trackingGoalId, setTrackingGoalId] = useState<string | null>(null);

  // Fetch goals
  const { data, isLoading } = useQuery({
    queryKey: goalsQueryKeys.list({ status: 'active' }),
    queryFn: () => goalsAPI.getAll({ status: 'active' }),
  });

  const goals = data?.goals || [];

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: goalsQueryKeys.stats(),
    queryFn: goalsAPI.getStats,
  });

  // Create goal mutation
  const createMutation = useMutation({
    mutationFn: goalsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.stats() });
      toast.success('Goal created successfully!');
      setShowForm(false);
      setFormData({});
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  // Update progress mutation with optimistic updates for instant UI feedback
  const updateProgressMutation = useMutation({
    mutationFn: ({ id, current_value }: { id: string; current_value: number }) =>
      goalsAPI.updateProgress(id, current_value),
    onMutate: async ({ id, current_value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: goalsQueryKeys.list({ status: 'active' }) });

      // Snapshot previous value
      const previousGoals = queryClient.getQueryData<{ goals: Goal[] }>(
        goalsQueryKeys.list({ status: 'active' })
      );

      // Optimistically update the cache
      if (previousGoals) {
        queryClient.setQueryData(goalsQueryKeys.list({ status: 'active' }), {
          ...previousGoals,
          goals: previousGoals.goals.map((goal) =>
            goal._id === id
              ? {
                  ...goal,
                  current_value,
                  progress_percentage: Math.min(
                    100,
                    Math.round(
                      ((current_value - goal.initial_value) /
                        (goal.target_value - goal.initial_value)) *
                        100
                    )
                  ),
                }
              : goal
          ),
        });
      }

      // Return context for rollback
      return { previousGoals };
    },
    onSuccess: () => {
      toast.success('Progress updated!');
    },
    onError: (_, __, context) => {
      // Rollback to previous value on error
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsQueryKeys.list({ status: 'active' }), context.previousGoals);
      }
      toast.error('Failed to update progress');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.stats() });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'paused' | 'active' | 'abandoned' }) =>
      goalsAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.stats() });
      toast.success('Goal status updated!');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: goalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.stats() });
      toast.success('Goal deleted!');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
    // Set default target date to 2 months from now
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
    const defaultTargetDate = twoMonthsFromNow.toISOString().split('T')[0];

    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      unit: template.unit,
      target_date: defaultTargetDate,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.initial_value === undefined || formData.target_value === undefined) {
      toast.error('Please set initial and target values');
      return;
    }

    createMutation.mutate(formData as CreateGoalInput);
  };

  const getDaysRemaining = (target_date?: string): number => {
    if (!target_date) return 0;
    const now = new Date();
    const target = new Date(target_date);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusBadge = (goal: Goal) => {
    if (goal.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (goal.status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          <Pause className="w-3 h-3" />
          Paused
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          {statsData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Total Goals</div>
                  <div className="text-2xl font-bold">{statsData.stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Active</div>
                  <div className="text-2xl font-bold text-blue-600">{statsData.stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Completed</div>
                  <div className="text-2xl font-bold text-green-600">
                    {statsData.stats.completed}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Avg Progress</div>
                  <div className="text-2xl font-bold">
                    {Math.round(statsData.stats.average_progress)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Goal Creation Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {!formData.type ? 'Create New Goal - Step 1: Choose Template' : 'Create New Goal - Step 2: Set Values'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({});
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!formData.type ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Choose a goal template:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {GOAL_TEMPLATES.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template)}
                          className={`p-4 ${template.bgColor} border-2 border-transparent hover:border-gray-300 rounded-lg transition-colors text-left`}
                        >
                          <template.icon className={`w-6 h-6 ${template.color} mb-2`} />
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-600 capitalize">{template.type} goal</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Name
                      </label>
                      <Input
                        label=""
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <Input
                        label=""
                        value={formData.description || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.type === 'decrease' ? 'Starting Value' : 'Initial Value'}
                        </label>
                        <Input
                          label=""
                          type="number"
                          step="0.01"
                          placeholder="Enter starting value"
                          value={formData.initial_value ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              initial_value: parseFloat(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target Value
                        </label>
                        <Input
                          label=""
                          type="number"
                          step="0.01"
                          placeholder="Enter target value"
                          value={formData.target_value ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_value: parseFloat(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date (optional)
                      </label>
                      <Input
                        label=""
                        type="date"
                        value={formData.target_date || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, target_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setFormData({})}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Creating...' : 'Create Goal'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Goals List */}
          {!showForm && (
            <>
              {goals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Goals</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first goal to start tracking your progress
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Create Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const daysRemaining = getDaysRemaining(goal.target_date);
                const isOverdue = daysRemaining < 0;

                return (
                  <Card key={goal._id} className="relative overflow-hidden">
                    {goal.status === 'completed' && (
                      <div className="absolute top-0 right-0 p-2">
                        <PartyPopper className="w-6 h-6 text-green-500" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                            {getStatusBadge(goal)}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="capitalize">{goal.type} goal</span>
                            <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                            {goal.target_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {isOverdue ? (
                                  <span className="text-red-600 font-medium">
                                    {Math.abs(daysRemaining)} days overdue
                                  </span>
                                ) : (
                                  <span>{daysRemaining} days left</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {goal.status === 'active' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: goal._id, status: 'paused' })
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Pause goal"
                            >
                              <Pause className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {goal.status === 'paused' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: goal._id, status: 'active' })
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Resume goal"
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(goal._id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete goal"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${getProgressColor(
                              goal.progress_percentage
                            )}`}
                            style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Started at {goal.initial_value} {goal.unit}</span>
                          <span className="font-semibold">
                            {Math.round(goal.progress_percentage)}%
                          </span>
                        </div>

                        {goal.status === 'active' && goal.progress_percentage < 100 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {trackingGoalId === goal._id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-700">
                                    Update Progress
                                  </label>
                                  <button
                                    onClick={() => setTrackingGoalId(null)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    label=""
                                    type="number"
                                    step="0.01"
                                    placeholder={`Current: ${goal.current_value}`}
                                    defaultValue={goal.current_value}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const newValue = parseFloat(
                                          (e.target as HTMLInputElement).value
                                        );
                                        updateProgressMutation.mutate({
                                          id: goal._id,
                                          current_value: newValue,
                                        });
                                        setTrackingGoalId(null);
                                      }
                                    }}
                                    className="flex-1 !py-2 !h-[42px]"
                                  />
                                  <Button
                                    onClick={(e) => {
                                      const input = e.currentTarget.parentElement?.querySelector(
                                        'input'
                                      ) as HTMLInputElement;
                                      const newValue = parseFloat(input.value);
                                      updateProgressMutation.mutate({
                                        id: goal._id,
                                        current_value: newValue,
                                      });
                                      setTrackingGoalId(null);
                                    }}
                                    className="whitespace-nowrap !h-[42px]"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTrackingGoalId(goal._id)}
                                className="w-full"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                Track Progress
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
            </>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
