import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { workoutAPI } from '../api';

export default function WorkoutsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutAPI.getAll,
  });

  const generateMutation = useMutation({
    mutationFn: workoutAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      alert('Workout generated successfully!');
    },
    onError: (error) => {
      alert('Failed to generate workout. Make sure OpenAI API key is configured.');
      console.error(error);
    },
  });

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
          <button
            onClick={() => generateMutation.mutate({})}
            className="btn-primary"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating...' : '🤖 Generate AI Workout'}
          </button>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <p className="text-gray-500 text-center py-8">Loading workouts...</p>
          )}

          {isError && (
            <p className="text-red-500 text-center py-8">Failed to load workouts. Please try again.</p>
          )}

          {!isLoading && !isError && data?.workouts && data.workouts.length > 0 ? (
            data.workouts.map((workout) => (
              <div key={workout._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{workout.workout_name}</h3>
                      {workout.ai_generated && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">AI Generated</span>
                      )}
                    </div>
                    {workout.description && (
                      <p className="text-gray-600 mb-3">{workout.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mb-4">
                      <span>⏱️ {workout.estimated_duration_minutes} min</span>
                      <span>📊 {workout.difficulty_level}</span>
                      <span>🏃 {workout.workout_type}</span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Exercises:</h4>
                      {workout.exercises.map((exercise, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{exercise.exercise_name}</p>
                          <p className="text-sm text-gray-600">
                            {exercise.sets && `${exercise.sets} sets`}
                            {exercise.reps && ` × ${exercise.reps} reps`}
                            {exercise.duration_seconds && ` • ${exercise.duration_seconds}s`}
                            {exercise.rest_seconds && ` • Rest: ${exercise.rest_seconds}s`}
                          </p>
                          {exercise.muscle_groups && (
                            <p className="text-xs text-gray-500 mt-1">
                              Muscles: {exercise.muscle_groups.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            !isLoading && !isError && (
              <p className="text-gray-500 text-center py-8">No workouts yet. Generate one using AI!</p>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
