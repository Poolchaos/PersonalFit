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
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { workoutAPI, profileAPI, equipmentAPI, queryKeys } from '../api';
import { Card, CardHeader, CardTitle, CardContent, Button, Modal } from '../design-system';
import { getEmptyStateImage } from '../utils/imageHelpers';
import { formatDuration } from '../utils/formatDuration';
import { WeeklyScheduleGrid } from '../components/workout/WeeklyScheduleGrid';
import { GeneratingWorkoutLoader } from '../components/onboarding/GeneratingWorkoutLoader';
import toast from 'react-hot-toast';
import type { Equipment } from '../types';
import {
  Sparkles,
  Dumbbell,
  Clock,
  Target,
  TrendingUp,
  Check,
  RefreshCw,
  Edit,
  Zap,
  Calendar,
  Lightbulb,
  Frown,
} from 'lucide-react';

// Type for the actual backend response structure
interface GeneratedPlan {
  id: string;
  plan_data: {
    plan_overview: {
      duration_weeks: number;
      sessions_per_week: number;
      focus_areas: string[];
      equipment_required: string[];
    };
    weekly_schedule: Array<{
      day: string;
      workout: {
        name: string;
        duration_minutes: number;
        focus: string;
        exercises: Array<{
          name: string;
          sets?: number;
          reps?: number | null;
          duration_seconds?: number | null;
          rest_seconds?: number | null;
          equipment: string[];
          target_muscles: string[];
          instructions: string;
          modifications: string;
        }>;
      };
    }>;
    progression_notes: string;
    safety_reminders: string[];
  };
  generation_context: {
    user_goals: string[];
    experience_level: string;
    equipment_used: string[];
    workout_modality: string;
  };
  created_at: string;
}

interface CustomizeSettings {
  workout_modality: 'strength' | 'cardio' | 'hybrid';
  workout_frequency: number;
  preferred_workout_duration: number;
}

export default function WorkoutPlanReviewPage() {
  const navigate = useNavigate();
  const [isAccepted, setIsAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'exercises' | 'schedule'>('schedule');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch profile and equipment for regeneration
  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: profileAPI.getProfile,
  });

  const { data: equipmentData } = useQuery({
    queryKey: queryKeys.equipment.all,
    queryFn: equipmentAPI.getAll,
  });

  // Initialize customization settings from current plan or profile
  const [customizeSettings, setCustomizeSettings] = useState<CustomizeSettings>({
    workout_modality: 'strength',
    workout_frequency: 3,
    preferred_workout_duration: 45,
  });

  // Regenerate workout mutation
  const regenerateMutation = useMutation({
    mutationFn: workoutAPI.generate,
    onSuccess: (newData) => {
      queryClient.setQueryData(['workouts'], newData);
      setIsRegenerating(false);
      setShowCustomizeModal(false);
      toast.success('New workout plan generated!');
    },
    onError: (error: unknown) => {
      setIsRegenerating(false);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to generate new plan. Please try again.');
    },
  });

  // First, try to get the cached plan data from the onboarding wizard
  const cachedData = queryClient.getQueryData(['workouts']);

  // If no cached data, fetch from API
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
    enabled: !cachedData, // Only fetch if we don't have cached data
  });

  const data = cachedData || fetchedData;

  // Get the most recent workout plan (the one just generated)
  // Backend generate endpoint returns { plan: {...} }
  // Backend getAll endpoint returns { workouts: [...] }
  const plan: GeneratedPlan | undefined =
    (data as unknown as { plan?: GeneratedPlan })?.plan ||
    (data as unknown as { workouts?: GeneratedPlan[] })?.workouts?.[0];

  // Update customizeSettings when plan loads
  useState(() => {
    if (plan?.generation_context) {
      setCustomizeSettings({
        workout_modality: (plan.generation_context.workout_modality as 'strength' | 'cardio' | 'hybrid') || 'strength',
        workout_frequency: plan.plan_data.plan_overview.sessions_per_week || 3,
        preferred_workout_duration: Math.round(
          plan.plan_data.weekly_schedule.reduce((sum, day) => sum + day.workout.duration_minutes, 0) /
          plan.plan_data.weekly_schedule.filter(d => d.workout).length
        ) || 45,
      });
    }
  });

  // Show generating loader while regenerating
  if (isRegenerating) {
    return <GeneratingWorkoutLoader />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-neutral-600">Loading your workout plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src={getEmptyStateImage('no-plan')}
              alt="No plan"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <div className="mb-4"><Frown className="w-16 h-16 text-neutral-400 mx-auto" /></div>
            <h2 className="text-2xl font-bold mb-2">No Workout Plan Found</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't find your generated workout plan. Please try generating a new one.
            </p>
            <Button onClick={() => navigate('/workouts')}>
              Go to Workouts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleAccept = () => {
    setIsAccepted(true);
    // Invalidate profile query to ensure dashboard has fresh data
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const handleCustomize = () => {
    // Update customizeSettings from current plan before opening modal
    if (plan?.generation_context) {
      setCustomizeSettings({
        workout_modality: (plan.generation_context.workout_modality as 'strength' | 'cardio' | 'hybrid') || 'strength',
        workout_frequency: plan.plan_data.plan_overview.sessions_per_week || 3,
        preferred_workout_duration: Math.round(
          plan.plan_data.weekly_schedule.reduce((sum, day) => sum + day.workout.duration_minutes, 0) /
          plan.plan_data.weekly_schedule.filter(d => d.workout).length
        ) || 45,
      });
    }
    setShowCustomizeModal(true);
  };

  const handleRegenerate = () => {
    // Regenerate using existing profile settings
    setIsRegenerating(true);
    const equipment = equipmentData?.equipment?.map((eq: Equipment) => eq.equipment_name) || [];
    regenerateMutation.mutate({
      workout_modality: plan?.generation_context?.workout_modality || 'strength',
      fitness_goals: profileData?.user?.profile?.fitness_goals,
      experience_level: profileData?.user?.profile?.experience_level,
      workout_frequency: plan?.plan_data?.plan_overview?.sessions_per_week,
      preferred_workout_duration: Math.round(
        (plan?.plan_data?.weekly_schedule?.reduce((sum, day) => sum + day.workout.duration_minutes, 0) || 45) /
        (plan?.plan_data?.weekly_schedule?.length || 1)
      ),
      equipment,
    });
  };

  const handleCustomizeSubmit = () => {
    // Regenerate with customized settings
    setIsRegenerating(true);
    setShowCustomizeModal(false);
    const equipment = equipmentData?.equipment?.map((eq: Equipment) => eq.equipment_name) || [];
    regenerateMutation.mutate({
      workout_modality: customizeSettings.workout_modality,
      fitness_goals: profileData?.user?.profile?.fitness_goals,
      experience_level: profileData?.user?.profile?.experience_level,
      workout_frequency: customizeSettings.workout_frequency,
      preferred_workout_duration: customizeSettings.preferred_workout_duration,
      equipment,
    });
  };

  // Calculate stats from the weekly schedule
  const totalExercises = plan.plan_data.weekly_schedule.reduce((sum, day) => sum + day.workout.exercises.length, 0);
  const totalXP = totalExercises * 10;
  const uniqueMuscles = [...new Set(
    plan.plan_data.weekly_schedule.flatMap(day =>
      day.workout.exercises.flatMap(ex => ex.target_muscles)
    )
  )];
  const totalDuration = plan.plan_data.weekly_schedule.reduce((sum, day) => sum + day.workout.duration_minutes, 0);
  const avgDuration = Math.round(totalDuration / plan.plan_data.weekly_schedule.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Customize Modal */}
        <Modal
          isOpen={showCustomizeModal}
          onClose={() => setShowCustomizeModal(false)}
          title="Customize Your Plan"
        >
          <div className="space-y-6">
            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Training Focus
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'strength', label: 'Strength', icon: Dumbbell },
                  { value: 'cardio', label: 'Cardio', icon: Zap },
                  { value: 'hybrid', label: 'Hybrid', icon: Target },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setCustomizeSettings({ ...customizeSettings, workout_modality: value as 'strength' | 'cardio' | 'hybrid' })}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      customizeSettings.workout_modality === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions Per Week */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Sessions Per Week: <span className="text-primary-600 font-bold">{customizeSettings.workout_frequency}</span>
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={customizeSettings.workout_frequency}
                onChange={(e) => setCustomizeSettings({ ...customizeSettings, workout_frequency: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>

            {/* Duration Per Session */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Session Duration: <span className="text-primary-600 font-bold">{customizeSettings.preferred_workout_duration} min</span>
              </label>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={customizeSettings.preferred_workout_duration}
                onChange={(e) => setCustomizeSettings({ ...customizeSettings, preferred_workout_duration: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>15 min</span>
                <span>90 min</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCustomizeModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCustomizeSubmit}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Plan
              </Button>
            </div>
          </div>
        </Modal>

        {/* Success celebration overlay */}
        {isAccepted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-12 text-center animate-scale-in">
              <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-success-600" />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Plan Accepted!</h2>
              <p className="text-neutral-600">Let's start your fitness journey...</p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 md:p-12 text-white mb-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Your Workout Plan is Ready!</h1>
              <p className="text-primary-100 mt-1">Personalized just for you by AI</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Clock className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{avgDuration}</div>
              <div className="text-sm text-primary-100">Min/Session</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Dumbbell className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{totalExercises}</div>
              <div className="text-sm text-primary-100">Exercises</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Zap className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{totalXP}</div>
              <div className="text-sm text-primary-100">XP to Earn</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Target className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{uniqueMuscles.length}</div>
              <div className="text-sm text-primary-100">Muscle Groups</div>
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Plan Info with Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Workout Plan</CardTitle>
                  {/* Tab Buttons */}
                  <div className="flex bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'schedule'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Weekly Schedule
                    </button>
                    <button
                      onClick={() => setActiveTab('exercises')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'exercises'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Dumbbell className="w-4 h-4" />
                      Exercise Details
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-6">
                  {plan.plan_data.plan_overview.duration_weeks} week program, {plan.plan_data.plan_overview.sessions_per_week} sessions per week
                </p>

                {/* Tab Content */}
                {activeTab === 'schedule' && (
                  <WeeklyScheduleGrid
                    schedule={plan.plan_data.weekly_schedule}
                    totalXP={totalXP}
                  />
                )}

                {activeTab === 'exercises' && (
                  <div className="space-y-6">
                    {plan.plan_data.weekly_schedule.map((daySchedule, dayIndex) => (
                      <div key={dayIndex} className="border border-neutral-200 rounded-lg p-4">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-neutral-900">{daySchedule.day}</h3>
                          <h4 className="text-lg text-primary-600 font-semibold">{daySchedule.workout.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {daySchedule.workout.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {daySchedule.workout.focus}
                            </span>
                          </div>
                        </div>

                        {/* Exercises for this day */}
                        <div className="space-y-3">
                          {daySchedule.workout.exercises.map((exercise, exIndex) => (
                            <div
                              key={exIndex}
                              className="border border-neutral-100 rounded-lg p-3 bg-neutral-50"
                            >
                              <h5 className="font-semibold text-neutral-900 mb-2">
                                {exIndex + 1}. {exercise.name}
                              </h5>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {exercise.target_muscles.map((muscle, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                                  >
                                    {muscle}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                                {exercise.sets && (
                                  <div>
                                    <span className="text-neutral-500">Sets:</span>
                                    <span className="ml-1 font-semibold">{exercise.sets}</span>
                                  </div>
                                )}
                                {exercise.reps && (
                                  <div>
                                    <span className="text-neutral-500">Reps:</span>
                                    <span className="ml-1 font-semibold">{exercise.reps}</span>
                                  </div>
                                )}
                                {exercise.duration_seconds && (
                                  <div>
                                    <span className="text-neutral-500">Duration:</span>
                                    <span className="ml-1 font-semibold">{formatDuration(exercise.duration_seconds)}</span>
                                  </div>
                                )}
                                {exercise.rest_seconds && (
                                  <div>
                                    <span className="text-neutral-500">Rest:</span>
                                    <span className="ml-1 font-semibold">{formatDuration(exercise.rest_seconds)}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600 italic flex items-start gap-1">
                                <Lightbulb className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <span>{exercise.instructions}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Gamification & Actions */}
          <div className="space-y-6">
            {/* Plan Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Plan Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Duration:</span> {plan.plan_data.plan_overview.duration_weeks} weeks
                  </div>
                  <div>
                    <span className="font-semibold">Frequency:</span> {plan.plan_data.plan_overview.sessions_per_week}x per week
                  </div>
                  <div>
                    <span className="font-semibold">Focus Areas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {plan.plan_data.plan_overview.focus_areas.map((area, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {area.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Muscles Targeted */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Muscles Targeted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uniqueMuscles.map((muscle, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-full font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progressive Overload Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  {plan.plan_data.progression_notes}
                </p>
                {plan.plan_data.safety_reminders.length > 0 && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-primary-900 mb-1">Safety Tips:</p>
                    <ul className="text-primary-700 space-y-1 ml-4 list-disc">
                      {plan.plan_data.safety_reminders.map((reminder, idx) => (
                        <li key={idx}>{reminder}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                variant="success"
                size="lg"
                onClick={handleAccept}
              >
                <Check className="w-5 h-5 mr-2" />
                Accept & Start Journey
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleCustomize}
              >
                <Edit className="w-5 h-5 mr-2" />
                Customize Plan
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleRegenerate}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Generate New Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
