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
  const [data, setData] = useState<OnboardingData>({
    openai_token: '',
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
      toast.loading('Generating your personalized workout plan...');

      // Generate initial workout plan
      await generateWorkoutMutation.mutateAsync({});
    } catch (error) {
      toast.dismiss();
      toast.error('Something went wrong. Please try again.');
      console.error('Onboarding error:', error);
    }
  };

  const totalSteps = 6; // Updated to include token step
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
          icon: <Target className="w-16 h-16 text-primary-500" />,
          title: 'Your Goals',
          imageUrl: '/images/onboarding/step-2-goals.jpg',
          imageAlt: 'Woman climbing toward fitness goal target',
        };
      case 3:
        return {
          icon: <Dumbbell className="w-16 h-16 text-primary-500" />,
          title: 'Experience Level',
          imageUrl: '/images/onboarding/step-3-experience.jpg',
          imageAlt: 'Three people at different fitness levels exercising',
        };
      case 4:
        return {
          icon: <Calendar className="w-16 h-16 text-primary-500" />,
          title: 'Workout Schedule',
          imageUrl: '/images/onboarding/step-4-schedule.jpg',
          imageAlt: 'Person planning workout schedule on calendar',
        };
      case 5:
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
                    onChange={(e) => setData({ ...data, openai_token: e.target.value })}
                  />

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
                <h3 className="text-xl font-semibold mb-2">What are your fitness goals?</h3>
                <p className="text-neutral-600 mb-6">Select all that apply</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

          {step === 3 && (
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

          {step === 4 && (
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

          {step === 5 && (
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
                  if (step === 2 && (!data.profile.fitness_goals || data.profile.fitness_goals.length === 0)) {
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
