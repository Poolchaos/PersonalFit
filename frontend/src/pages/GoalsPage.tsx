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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, TrendingUp, Plus, Trash2, CheckCircle2, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { profileAPI } from '../api';
import { PageTransition } from '../components/layout/PageTransition';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'flexibility' | 'general';
}

// Predefined goal templates
const GOAL_TEMPLATES = [
  { name: 'Lose Weight', category: 'weight_loss' as const, unit: 'kg', icon: TrendingUp },
  { name: 'Gain Muscle', category: 'muscle_gain' as const, unit: 'kg', icon: Target },
  { name: 'Increase Strength', category: 'strength' as const, unit: 'kg', icon: Target },
  { name: 'Improve Endurance', category: 'endurance' as const, unit: 'minutes', icon: TrendingUp },
  { name: 'Flexibility', category: 'flexibility' as const, unit: 'cm', icon: Target },
  { name: 'General Fitness', category: 'general' as const, unit: 'workouts', icon: CheckCircle2 },
];

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([
    // Mock data - in real app would come from backend
    {
      id: '1',
      name: 'Lose Weight',
      target: 75,
      current: 82,
      unit: 'kg',
      deadline: '2025-12-31',
      category: 'weight_loss',
    },
  ]);

  // Calculate once for the entire component render using lazy initializer
  const [now] = useState(() => Date.now());

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Goals updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update goals. Please try again.');
    },
  });

  const handleAddGoal = (template: typeof GOAL_TEMPLATES[0]) => {
    const timestamp = now;
    const newGoal: Goal = {
      id: timestamp.toString(),
      name: template.name,
      target: 0,
      current: 0,
      unit: template.unit,
      deadline: new Date(timestamp + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      category: template.category,
    };
    setEditingGoal(newGoal);
    setShowForm(true);
  };

  const handleSaveGoal = (goal: Goal) => {
    if (goal.id && goals.find(g => g.id === goal.id)) {
      // Update existing
      setGoals(goals.map(g => (g.id === goal.id ? goal : g)));
      toast.success('Goal updated!');
    } else {
      // Add new
      setGoals([...goals, { ...goal, id: goal.id || now.toString() }]);
      toast.success('Goal added!');
    }

    // Update fitness_goals in profile
    const fitnessGoals = [...new Set([...(profileData?.user.profile.fitness_goals || []), goal.category])];
    updateProfileMutation.mutate({ fitness_goals: fitnessGoals });

    setShowForm(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    toast.success('Goal deleted!');
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (current: number, target: number, deadline: string, currentTime: number) => {
    const progress = calculateProgress(current, target);
    const daysLeft = Math.ceil((new Date(deadline).getTime() - currentTime) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.max(0, 100 - (daysLeft / 90) * 100); // Assuming 90-day goals

    if (progress >= expectedProgress * 0.8) return 'bg-green-500';
    if (progress >= expectedProgress * 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant="primary">
            {showForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" />Add Goal</>}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingGoal?.id ? 'Edit Goal' : 'Select Goal Type'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editingGoal ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {GOAL_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.category}
                        onClick={() => handleAddGoal(template)}
                        className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all flex flex-col items-center gap-2"
                      >
                        <Icon className="h-8 w-8 text-primary" />
                        <span className="font-medium text-sm text-gray-900">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <GoalForm
                  goal={editingGoal}
                  onSave={handleSaveGoal}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Target className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No goals set yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Set specific, measurable goals to track your fitness progress
                </p>
                <Button onClick={() => setShowForm(true)} variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal.current, goal.target);
              const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now) / (1000 * 60 * 60 * 24));

              return (
                <Card key={goal.id} hover>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{goal.name}</h3>
                        <p className="text-sm text-gray-500">
                          Target: {goal.target} {goal.unit} by {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingGoal(goal);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {goal.current} / {goal.target} {goal.unit} ({progress}%)
                        </span>
                      </div>
                      <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(
                            goal.current,
                            goal.target,
                            goal.deadline,
                            now
                          )}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {progress >= 100 && (
                      <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Goal achieved!</span>
                        <PartyPopper className="h-5 w-5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
      </PageTransition>
    </Layout>
  );
}

interface GoalFormProps {
  goal: Goal;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState(goal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.target <= 0) {
      toast.error('Target must be greater than 0');
      return;
    }
    if (formData.current < 0) {
      toast.error('Current value cannot be negative');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Goal Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`Current ${formData.unit}`}
          type="number"
          step="0.1"
          value={formData.current}
          onChange={(e) => setFormData({ ...formData, current: Number(e.target.value) })}
          required
        />
        <Input
          label={`Target ${formData.unit}`}
          type="number"
          step="0.1"
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
          required
        />
      </div>

      <Input
        label="Target Date"
        type="date"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        required
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary">
          Save Goal
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
