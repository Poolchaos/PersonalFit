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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileAPI, equipmentAPI, workoutAPI, aiConfigAPI, queryKeys } from '../../api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../design-system';
import { ChevronRight, ChevronLeft, Sparkles, Key, User, Target, Dumbbell, Calendar, Zap, Pill } from 'lucide-react';
import type { Equipment } from '../../types';
import { GeneratingWorkoutLoader } from './GeneratingWorkoutLoader';
import type { OnboardingData } from './types';
import { validateStep } from './validation';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // Start at step 0 for token
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenTested, setTokenTested] = useState(false);

  // Fetch existing AI config to check if API key already exists
  const { data: aiConfig } = useQuery({
    queryKey: queryKeys.aiConfig.all,
    queryFn: aiConfigAPI.get,
  });

  // Fetch existing profile data
  const { data: existingProfile } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: profileAPI.getProfile,
  });

  // Fetch existing equipment
  const { data: existingEquipment } = useQuery({
    queryKey: queryKeys.equipment.all,
    queryFn: equipmentAPI.getAll,
  });

  const hasExistingKey = aiConfig?.ai_config?.has_api_key || false;

  const [data, setData] = useState<OnboardingData>({
    openai_token: '',
    workout_modality: 'strength',
    profile: {},
    medications: {
      has_medications: false,
      list: '',
    },
    equipment: [],
    preferences: {},
  });

  // Load existing data when profile/equipment loads (only if re-onboarding, not for new users)
  useEffect(() => {
    // Only populate form if user has actually completed onboarding before
    // Check if profile has meaningful data (not just defaults)
    if (existingProfile?.user?.profile?.first_name && existingProfile?.user?.profile?.last_name) {
      const user = existingProfile.user;
      setData((prev) => ({
        ...prev,
        profile: {
          first_name: user.profile?.first_name || prev.profile.first_name,
          last_name: user.profile?.last_name || prev.profile.last_name,
          height_cm: user.profile?.height_cm || prev.profile.height_cm,
          weight_kg: user.profile?.weight_kg || prev.profile.weight_kg,
          current_activities: user.profile?.current_activities || prev.profile.current_activities,
          injuries_and_restrictions: user.profile?.injuries_and_restrictions || prev.profile.injuries_and_restrictions,
          fitness_goals: user.profile?.fitness_goals || prev.profile.fitness_goals,
          experience_level: user.profile?.experience_level || prev.profile.experience_level,
        },
        preferences: {
          workout_frequency: (user.preferences as { workout_frequency?: number })?.workout_frequency || prev.preferences.workout_frequency || 3,
          preferred_workout_duration: user.preferences?.preferred_workout_duration || prev.preferences.preferred_workout_duration || 45,
        },
      }));
    }

    if (existingEquipment?.equipment && existingEquipment.equipment.length > 0) {
      const equipmentNames = existingEquipment.equipment.map((eq: Equipment) => eq.equipment_name);
      setData((prev) => ({
        ...prev,
        equipment: equipmentNames,
      }));
    }
  }, [existingProfile, existingEquipment]);

  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: profileAPI.updatePreferences,
  });

  const updateAIConfigMutation = useMutation({
    mutationFn: aiConfigAPI.update,
  });

  const testAIConfigMutation = useMutation({
    mutationFn: async () => {
      // First save the token
      await aiConfigAPI.update({
        provider: 'openai',
        api_key: data.openai_token,
        enabled: true,
      });
      // Then test it
      return aiConfigAPI.test();
    },
    onSuccess: () => {
      setTokenTested(true);
      toast.success('âœ… API key verified successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      setTokenTested(false);
      toast.error(err.response?.data?.error || 'API key verification failed. Please check your key.');
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: equipmentAPI.create,
  });

  const generateWorkoutMutation = useMutation({
    mutationFn: workoutAPI.generate,
    onSuccess: async (response) => {
      // Set the generated plan in cache so the review page can access it
      queryClient.setQueryData(queryKeys.workouts.all, response);
      toast.success('Your personalized workout plan is ready!');
      navigate('/workout-plan-review');
    },
    onError: (error: unknown) => {
      setIsGenerating(false);
      const err = error as { response?: { data?: { error?: string }; status?: number } };
      const errorMessage = err.response?.data?.error || 'Failed to generate workout plan';

      console.error('Workout generation error:', error);
      console.error('Error details:', err.response);

      // Show specific error message
      if (errorMessage.includes('API key')) {
        toast.error('AI configuration issue: ' + errorMessage + ' Please check your API key in step 1.');
      } else if (errorMessage.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (errorMessage.includes('authenticate')) {
        toast.error('API authentication failed. Please verify your API key is valid and active.');
      } else {
        toast.error(errorMessage + ' You can retry by clicking "Complete Setup" again.');
      }

      // Don't navigate away - stay on onboarding to allow retry
    },
  });

  const handleComplete = async () => {
    try {
      toast.loading('Setting up your profile...');

      // Save OpenAI API key only if it's a new key (not the placeholder)
      if (data.openai_token && data.openai_token !== 'existing_key_on_file') {
        await updateAIConfigMutation.mutateAsync({
          provider: 'openai',
          api_key: data.openai_token,
          enabled: true,
        });
      }

      // Update profile
      if (Object.keys(data.profile).length > 0) {
        await updateProfileMutation.mutateAsync(data.profile);
      }

      // Save onboarding medications notes if provided
      if (data.medications?.has_medications && data.medications?.list) {
        await updateProfileMutation.mutateAsync({
          onboarding_medications_notes: data.medications.list,
        });
      }

      // Update preferences
      if (Object.keys(data.preferences).length > 0) {
        await updatePreferencesMutation.mutateAsync(data.preferences);
      }

      // Add equipment (only new ones that don't exist yet)
      const existingEquipmentNames = existingEquipment?.equipment
        ? existingEquipment.equipment.map((eq: Equipment) => eq.equipment_name)
        : [];

      const newEquipment = data.equipment.filter(
        (equipmentName: string) => !existingEquipmentNames.includes(equipmentName)
      );

      for (const equipmentName of newEquipment) {
        await createEquipmentMutation.mutateAsync({
          equipment_name: equipmentName,
          equipment_type: 'other' as Equipment['equipment_type'],
          quantity: 1,
          condition: 'good' as Equipment['condition'],
        });
      }

      toast.dismiss();
      setIsGenerating(true);

      // Generate initial workout plan with all the collected data
      await generateWorkoutMutation.mutateAsync({
        workout_modality: data.workout_modality || 'strength',
        fitness_goals: data.profile.fitness_goals,
        experience_level: data.profile.experience_level,
        workout_frequency: data.preferences.workout_frequency,
        preferred_workout_duration: data.preferences.preferred_workout_duration,
        equipment: data.equipment,
      });
    } catch (error) {
      toast.dismiss();
      setIsGenerating(false);
      toast.error('Something went wrong. Please try again.');
      console.error('Onboarding error:', error);
    }
  };

  const totalSteps = 8; // Updated to include token + modality + medications steps
  const progress = ((step + 1) / totalSteps) * 100;

  // Helper to get icon and image description for current step
  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          icon: <Key className="w-16 h-16 text-primary-500" />,
          title: 'AI-Powered Workouts',
          imageUrl: '/images/onboarding/step-0-ai-token.jpg',
          imageAlt: 'Programmer working with AI fitness interface',
        };
      case 1:
        return {
          icon: <User className="w-16 h-16 text-primary-500" />,
          title: 'Your Profile',
          imageUrl: '/images/onboarding/step-1-profile.jpg',
          imageAlt: 'Athletic person with fitness profile on tablet',
        };
      case 2:
        return {
          icon: <Zap className="w-16 h-16 text-primary-500" />,
          title: 'Workout Type',
          imageUrl: '/images/onboarding/step-2-modality.jpg',
          imageAlt: 'Person choosing between strength and cardio training',
        };
      case 3:
        return {
          icon: <Target className="w-16 h-16 text-primary-500" />,
          title: 'Your Goals',
          imageUrl: '/images/onboarding/step-2-goals.jpg',
          imageAlt: 'Woman climbing toward fitness goal target',
        };
      case 4:
        return {
          icon: <Dumbbell className="w-16 h-16 text-primary-500" />,
          title: 'Experience Level',
          imageUrl: '/images/onboarding/step-3-experience.jpg',
          imageAlt: 'Three people at different fitness levels exercising',
        };
      case 5:
        return {
          icon: <Pill className="w-16 h-16 text-primary-500" />,
          title: 'Medications & Supplements',
          imageUrl: '/images/onboarding/step-6-medications.jpg', // Medications image
          imageAlt: 'Person taking medications with fitness tracking',
        };
      case 6:
        return {
          icon: <Calendar className="w-16 h-16 text-primary-500" />,
          title: 'Workout Schedule',
          imageUrl: '/images/onboarding/step-4-schedule.jpg',
          imageAlt: 'Person planning workout schedule on calendar',
        };
      case 7:
        return {
          icon: <Dumbbell className="w-16 h-16 text-primary-500" />,
          title: 'Available Equipment',
          imageUrl: '/images/onboarding/step-5-equipment.jpg',
          imageAlt: 'Home gym with organized fitness equipment',
        };
      default:
        return {
          icon: <Sparkles className="w-16 h-16 text-primary-500" />,
          title: 'Welcome',
          imageUrl: '/images/onboarding/welcome.jpg',
          imageAlt: 'Welcome to PersonalFit',
        };
    }
  };

  const stepContent = getStepContent();

  // Full-screen loading animation
  if (isGenerating) {
    return <GeneratingWorkoutLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <CardTitle>Welcome to PersonalFit!</CardTitle>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-neutral-600 mt-2">Step {step + 1} of {totalSteps}</p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - Image/Illustration */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg overflow-hidden min-h-[400px]">
              {stepContent.imageUrl ? (
                <img
                  src={stepContent.imageUrl}
                  alt={stepContent.imageAlt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              {/* Fallback icon display - shown when no image URL or image fails to load */}
              <div className={`flex flex-col items-center justify-center p-8 w-full h-full ${stepContent.imageUrl ? 'hidden' : ''}`}>
                <div className="mb-4">
                  {stepContent.icon}
                </div>
                <p className="text-sm text-primary-700 font-medium text-center">
                  {stepContent.title}
                </p>
              </div>
            </div>

            {/* Right side - Form content */}
            <div>
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">OpenAI API Setup</h3>
                    <p className="text-neutral-600 mb-6">
                      PersonalFit uses AI to generate personalized workout plans. You'll need an OpenAI API key to get started.
                    </p>
                  </div>

                  {hasExistingKey && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-success-900 mb-1 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        API Key Already Configured
                      </h4>
                      <p className="text-sm text-success-800">
                        You have an OpenAI API key on file. You can skip this step or update it with a new key below.
                      </p>
                    </div>
                  )}

                  {!hasExistingKey && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        How to get your API key:
                      </h4>
                      <ol className="text-sm text-primary-800 space-y-2 ml-4 list-decimal">
                        <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">platform.openai.com/api-keys</a></li>
                        <li>Sign in or create an OpenAI account</li>
                        <li>Click "Create new secret key"</li>
                        <li>Copy the key and paste it below</li>
                      </ol>
                    </div>
                  )}

                  <Input
                    label={hasExistingKey ? "Update OpenAI API Key (optional)" : "OpenAI API Key"}
                    type="password"
                    placeholder={hasExistingKey ? "Leave empty to use existing key" : "sk-..."}
                    value={data.openai_token || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setData({ ...data, openai_token: e.target.value });
                      setTokenTested(false); // Reset verification when key changes
                    }}
                  />

                  <div className="flex gap-3">
                    {data.openai_token && (
                      <Button
                        onClick={() => testAIConfigMutation.mutate()}
                        loading={testAIConfigMutation.isPending}
                        disabled={!data.openai_token || data.openai_token.length < 20}
                        variant="secondary"
                        className="flex-1"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Test Connection
                      </Button>
                    )}
                    {tokenTested && (
                      <div className="flex items-center gap-2 text-success-dark font-medium px-4 py-2 bg-success-50 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </div>
                    )}
                    {hasExistingKey && !data.openai_token && (
                      <div className="flex items-center gap-2 text-success-dark font-medium px-4 py-2 bg-success-50 rounded-lg flex-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Using existing key
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500">
                    Your API key is securely stored and only used to generate your workouts. We never share it with third parties.
                  </p>
                </div>
              )}

              {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Let's get to know you</h3>
                <p className="text-neutral-600 mb-6">Tell us a bit about yourself to personalize your fitness journey.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  value={data.profile.first_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, first_name: e.target.value } })}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={data.profile.last_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, last_name: e.target.value } })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Height (cm)"
                  type="number"
                  placeholder="175"
                  value={data.profile.height_cm || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, height_cm: Number(e.target.value) } })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  placeholder="70"
                  value={data.profile.weight_kg || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, profile: { ...data.profile, weight_kg: Number(e.target.value) } })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Current Regular Activities
                  <span className="text-neutral-500 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
                  placeholder="e.g., Daily 30min uphill walk with dog, 3x weekly yoga classes, cycle to work 5km each way"
                  value={data.profile.current_activities || ''}
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, current_activities: e.target.value } })}
                />
                <p className="text-xs text-neutral-500 flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Tell us about physical activities you already do regularly. This helps us create a workout plan that complements your lifestyle without overtraining.</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Injuries, Impairments & Exercise Restrictions
                  <span className="text-neutral-500 font-normal ml-1">(optional but important)</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px] resize-y"
                  placeholder="e.g., Injured left knee - no squats or lunges; Pilonidal sinus - cannot do situps or exercises with direct pressure on lower back; Previous shoulder surgery - limited overhead movements"
                  value={data.profile.injuries_and_restrictions || ''}
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, injuries_and_restrictions: e.target.value } })}
                />
                <p className="text-xs text-red-600 flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Important for your safety: Please list any injuries, medical conditions, or physical limitations. This ensures your workout plan avoids exercises that could cause harm or aggravate existing conditions.</span>
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-800">
                    <strong>Examples:</strong> Knee injuries, back problems, shoulder impairments, missing limbs, pilonidal sinus, hernias, recent surgeries, balance issues, joint problems, chronic pain conditions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Training Focus</h3>
                <p className="text-neutral-600 mb-6">What type of workout are you most interested in?</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setData({ ...data, workout_modality: 'strength' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    data.workout_modality === 'strength'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <Dumbbell className="w-8 h-8 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-lg mb-1">Strength Training</div>
                    <div className="text-sm text-neutral-600">
                      Build muscle, increase strength, and improve body composition with resistance exercises
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setData({ ...data, workout_modality: 'cardio' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    data.workout_modality === 'cardio'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <Zap className="w-8 h-8 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-lg mb-1">Cardio Training</div>
                    <div className="text-sm text-neutral-600">
                      Improve endurance and heart health with walking, jogging, jump rope, and interval training
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setData({ ...data, workout_modality: 'hybrid' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    data.workout_modality === 'hybrid'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <Target className="w-8 h-8 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-lg mb-1">Hybrid Training</div>
                    <div className="text-sm text-neutral-600">
                      Combine strength and cardio for balanced fitness, weight loss, and overall athleticism
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">What are your fitness goals?</h3>
                <p className="text-neutral-600 mb-6">Select all that apply</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility', 'General Fitness'].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      const currentGoals = data.profile.fitness_goals || [];
                      const goalLower = goal.toLowerCase().replace(' ', '_');
                      if (currentGoals.includes(goalLower)) {
                        setData({
                          ...data,
                          profile: {
                            ...data.profile,
                            fitness_goals: currentGoals.filter((g) => g !== goalLower),
                          },
                        });
                      } else {
                        setData({
                          ...data,
                          profile: {
                            ...data.profile,
                            fitness_goals: [...currentGoals, goalLower],
                          },
                        });
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.profile.fitness_goals?.includes(goal.toLowerCase().replace(' ', '_'))
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Experience Level</h3>
                <p className="text-neutral-600 mb-6">How would you describe your fitness experience?</p>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'beginner' as const, label: 'Beginner', desc: 'New to working out' },
                  { value: 'intermediate' as const, label: 'Intermediate', desc: '6-12 months of experience' },
                  { value: 'advanced' as const, label: 'Advanced', desc: '1+ years of consistent training' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setData({ ...data, profile: { ...data.profile, experience_level: level.value } })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      data.profile.experience_level === level.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-semibold">{level.label}</div>
                    <div className="text-sm text-neutral-600">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Current Medications & Supplements</h3>
                <p className="text-neutral-600 mb-6">Optional - helps us generate safer and more personalized workout plans</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Why we ask:</strong> Some medications and supplements affect your heart rate, energy levels, and exercise capacity. Knowing what you're taking helps us create workouts that are safe and tailored to your individual health profile.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setData({ ...data, medications: { has_medications: false, list: '' } })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                      !data.medications?.has_medications
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-semibold">I'm Not Taking Any</div>
                    <div className="text-xs text-neutral-600 mt-1">Skip this section</div>
                  </button>
                  <button
                    onClick={() => setData({ ...data, medications: { has_medications: true, list: data.medications?.list || '' } })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                      data.medications?.has_medications
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-semibold">I Take Medications</div>
                    <div className="text-xs text-neutral-600 mt-1">Tell us what you take</div>
                  </button>
                </div>

                {data.medications?.has_medications && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-neutral-700">
                      List your medications and supplements
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px] resize-y"
                      placeholder="Examples:&#10;- Metformin 500mg, twice daily&#10;- Vitamin D 2000IU, once daily&#10;- Lisinopril 10mg, once daily&#10;&#10;Include: medication name, dose, and frequency"
                      value={data.medications?.list || ''}
                      onChange={(e) => setData({ ...data, medications: { has_medications: true, list: e.target.value } })}
                    />
                    <p className="text-xs text-neutral-500">
                      You don't need to be precise - just list what you're taking. We'll use this to inform your workout recommendations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Workout Preferences</h3>
                <p className="text-neutral-600 mb-6">Help us tailor your workout plans</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    How many days per week do you want to work out?
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                      <button
                        key={days}
                        onClick={() => setData({ ...data, preferences: { ...data.preferences, workout_frequency: days } })}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          data.preferences.workout_frequency === days
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-neutral-200 hover:border-primary-300'
                        }`}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Preferred workout duration (minutes)"
                  type="number"
                  placeholder="60"
                  value={data.preferences.preferred_workout_duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setData({ ...data, preferences: { ...data.preferences, preferred_workout_duration: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Available Equipment</h3>
                <p className="text-neutral-600 mb-6">What equipment do you have access to?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Dumbbells',
                  'Barbell',
                  'Bench',
                  'Pull-up Bar',
                  'Resistance Bands',
                  'Kettlebells',
                  'Treadmill',
                  'Stationary Bike',
                  'Jump Rope', // Added jump rope!
                  'None (Bodyweight)',
                ].map((eq) => (
                  <button
                    key={eq}
                    onClick={() => {
                      if (data.equipment.includes(eq)) {
                        setData({ ...data, equipment: data.equipment.filter((e) => e !== eq) });
                      } else {
                        setData({ ...data, equipment: [...data.equipment, eq] });
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.equipment.includes(eq)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-neutral-600">
                  Don't worry! You can add or modify equipment later in your profile.
                </p>
              </div>
            </div>
          )}
            </div> {/* Close form content div */}
          </div> {/* Close grid div */}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < totalSteps - 1 ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (validateStep(step, data, hasExistingKey)) {
                    setStep(step + 1);
                  }
                }}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                {generateWorkoutMutation.isError && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.success('Profile setup complete! You can generate a workout plan from the Workouts page.');
                      navigate('/dashboard');
                    }}
                  >
                    Skip & Go to Dashboard
                  </Button>
                )}
                <Button
                  variant="success"
                  onClick={handleComplete}
                  loading={
                    updateProfileMutation.isPending ||
                    updatePreferencesMutation.isPending ||
                    generateWorkoutMutation.isPending
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generateWorkoutMutation.isError ? 'Retry Generation' : 'Generate My Plan'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
