import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { workoutAPI } from '../api';
import { Card, Button, WorkoutCardSkeleton } from '../design-system';
import { Dumbbell, Zap, Clock, TrendingUp, Play } from 'lucide-react';
import { ActiveSession } from '../components/workout/ActiveSession';
import type { WorkoutPlan } from '../types';

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const generateMutation = useMutation({
    mutationFn: workoutAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('🎉 AI workout generated successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string }; status?: number } };
      console.error('Workout generation error:', error);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Don't navigate away - let auth interceptor handle it
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('profile')) {
        // Profile incomplete - redirect to onboarding
        toast.error('Please complete your profile first');
        navigate('/onboarding');
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to generate workout. Please try again or complete your profile setup.');
      }
    },
  });

  // Show active session if a workout is started
  if (activeWorkout) {
    return (
      <Layout>
        <PageTransition>
          <div className="px-4 py-6 sm:px-0">
            <ActiveSession
              workout={activeWorkout}
              onComplete={() => setActiveWorkout(null)}
              onCancel={() => setActiveWorkout(null)}
            />
          </div>
        </PageTransition>
      </Layout>
    );
  }

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
            data.workouts.map((workout) => (
              <Card key={workout._id} hover>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-neutral-900">{workout.workout_name}</h3>
                        {workout.ai_generated && (
                          <span className="flex items-center gap-1 text-xs bg-success-light/20 text-success-dark px-2 py-1 rounded-full">
                            <Zap className="w-3 h-3" />
                            AI Generated
                          </span>
                        )}
                      </div>
                      {workout.description && (
                        <p className="text-neutral-600 mb-4">{workout.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {workout.estimated_duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {workout.difficulty_level}
                        </span>
                        <span className="capitalize">{workout.workout_type.replace('_', ' ')}</span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-neutral-700">Exercises:</h4>
                        <div className="grid gap-2">
                          {workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                              <p className="font-medium text-neutral-900">{exercise.exercise_name}</p>
                              <p className="text-sm text-neutral-600 mt-1">
                                {exercise.sets && `${exercise.sets} sets`}
                                {exercise.reps && ` × ${exercise.reps} reps`}
                                {exercise.duration_seconds && ` • ${exercise.duration_seconds}s`}
                                {exercise.rest_seconds && ` • Rest: ${exercise.rest_seconds}s`}
                              </p>
                              {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {exercise.muscle_groups.map((muscle, i) => (
                                    <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                                      {muscle}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Start Workout Button */}
                        <div className="mt-4">
                          <Button
                            onClick={() => setActiveWorkout(workout)}
                            variant="primary"
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Workout
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            !isLoading && !isError && (
              <Card>
                <div className="p-12 text-center">
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
        </div>
      </PageTransition>
    </Layout>
  );
}
