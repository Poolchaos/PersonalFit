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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileAPI, equipmentAPI, workoutAPI, aiConfigAPI } from '../../api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../design-system';
import { ChevronRight, ChevronLeft, Sparkles, Key, User, Target, Dumbbell, Calendar, Zap } from 'lucide-react';
import type { UserProfile, Equipment } from '../../types';

interface OnboardingData {
  openai_token?: string;
  workout_modality?: 'strength' | 'cardio' | 'hybrid';
  profile: Partial<UserProfile>;
  equipment: string[];
  preferences: {
    preferred_workout_duration?: number;
    workout_frequency?: number;
  };
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // Start at step 0 for token
  const [tokenTested, setTokenTested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    openai_token: '',
    workout_modality: 'strength', // Default to strength
    profile: {},
    equipment: [],
    preferences: {},
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Your personalized workout plan is ready!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Failed to generate workout plan. You can try again from the Workouts page.');
      navigate('/dashboard');
    },
  });

  const handleComplete = async () => {
    try {
      toast.loading('Setting up your profile...');

      // Save OpenAI API key first
      if (data.openai_token) {
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

      // Update preferences
      if (Object.keys(data.preferences).length > 0) {
        await updatePreferencesMutation.mutateAsync(data.preferences);
      }

      // Add equipment
      for (const equipmentName of data.equipment) {
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

  const totalSteps = 7; // Updated to include token step + modality step
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
          icon: <Calendar className="w-16 h-16 text-primary-500" />,
          title: 'Workout Schedule',
          imageUrl: '/images/onboarding/step-4-schedule.jpg',
          imageAlt: 'Person planning workout schedule on calendar',
        };
      case 6:
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
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-2xl px-8">
          {/* Animated icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Sparkles className="w-24 h-24 animate-pulse" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Sparkles className="w-24 h-24" />
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold mb-4 animate-fade-in">
            Crafting Your Perfect Workout Plan
          </h1>

          {/* Status messages with animation */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center gap-3 text-lg animate-slide-in">
              <Zap className="w-5 h-5" />
              <span>Analyzing your fitness goals...</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-lg animate-slide-in animation-delay-300">
              <Dumbbell className="w-5 h-5" />
              <span>Customizing exercises for your experience level...</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-lg animate-slide-in animation-delay-600">
              <Target className="w-5 h-5" />
              <span>Optimizing for your equipment and schedule...</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progress" />
          </div>

          <p className="text-sm mt-4 text-white/80">
            This may take 10-30 seconds...
          </p>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-in {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          .animate-slide-in {
            animation: slide-in 0.6s ease-out;
          }
          .animation-delay-300 {
            animation-delay: 0.3s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          .animation-delay-600 {
            animation-delay: 0.6s;
            opacity: 0;
            animation-fill-mode: forwards;
          }
          .animate-progress {
            animation: progress 20s ease-out;
          }
        `}</style>
      </div>
    );
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
              {/* Fallback icon display */}
              <div className="hidden flex-col items-center justify-center p-8 w-full h-full">
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

                  <Input
                    label="OpenAI API Key"
                    type="password"
                    placeholder="sk-..."
                    value={data.openai_token || ''}
                    onChange={(e) => {
                      setData({ ...data, openai_token: e.target.value });
                      setTokenTested(false); // Reset verification when key changes
                    }}
                  />

                  <div className="flex gap-3">
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
                    {tokenTested && (
                      <div className="flex items-center gap-2 text-success-dark font-medium px-4 py-2 bg-success-50 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
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
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, first_name: e.target.value } })}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={data.profile.last_name || ''}
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, last_name: e.target.value } })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Height (cm)"
                  type="number"
                  placeholder="175"
                  value={data.profile.height_cm || ''}
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, height_cm: Number(e.target.value) } })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  placeholder="70"
                  value={data.profile.weight_kg || ''}
                  onChange={(e) => setData({ ...data, profile: { ...data.profile, weight_kg: Number(e.target.value) } })}
                />
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
                  onChange={(e) =>
                    setData({ ...data, preferences: { ...data.preferences, preferred_workout_duration: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          )}

          {step === 6 && (
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
                  // Validate step before proceeding
                  if (step === 0 && !data.openai_token) {
                    toast.error('Please enter your OpenAI API key to continue');
                    return;
                  }
                  if (step === 1 && !data.profile.first_name) {
                    toast.error('Please enter your name to continue');
                    return;
                  }
                  if (step === 2 && !data.workout_modality) {
                    toast.error('Please select a workout type to continue');
                    return;
                  }
                  if (step === 3 && (!data.profile.fitness_goals || data.profile.fitness_goals.length === 0)) {
                    toast.error('Please select at least one fitness goal');
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
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
                Generate My Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
