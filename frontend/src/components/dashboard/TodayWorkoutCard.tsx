import { Card } from '../../design-system';
import { Calendar, Clock, Target, Zap, TrendingUp, ChevronRight, Play } from 'lucide-react';
import { formatDuration } from '../../utils/formatDuration';

interface Exercise {
  name: string;
  sets?: number;
  reps?: number | null;
  duration_seconds?: number | null;
  target_muscles: string[];
}

interface TodayWorkout {
  day: string;
  workout: {
    name: string;
    duration_minutes: number;
    focus: string;
    exercises: Exercise[];
  };
}

interface TodayWorkoutCardProps {
  workout: TodayWorkout | null;
  isCompleted: boolean;
  xpToEarn: number;
  onStart: () => void;
}

export function TodayWorkoutCard({ workout, isCompleted, xpToEarn, onStart }: TodayWorkoutCardProps) {
  if (!workout) {
    return (
      <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-dashed border-neutral-300">
        <div className="p-8 text-center">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-600 mb-2">Rest Day</h3>
          <p className="text-neutral-500">Enjoy your recovery! Tomorrow's workout is ready.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isCompleted
          ? 'bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-300'
          : 'bg-gradient-to-br from-primary-50 via-primary-100 to-purple-50 border-2 border-primary-300'
      }`}
    >
      {/* Header with completion status */}
      <div className={`px-6 py-4 ${isCompleted ? 'bg-success-500' : 'bg-primary-500'}`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCompleted ? 'bg-success-600' : 'bg-primary-600'
            }`}>
              {isCompleted ? (
                <Target className="w-6 h-6" />
              ) : (
                <Calendar className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">
                {isCompleted ? '✅ Completed' : 'Today\'s Workout'}
              </p>
              <h2 className="text-2xl font-bold">{workout.workout.name}</h2>
            </div>
          </div>

          {!isCompleted && (
            <div className="text-right">
              <p className="text-sm opacity-90">XP to Earn</p>
              <div className="flex items-center gap-1">
                <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                <span className="text-2xl font-bold">{xpToEarn}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workout details */}
      <div className="p-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Duration</p>
              <p className="font-bold text-neutral-900">{workout.workout.duration_minutes}m</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Focus</p>
              <p className="font-bold text-neutral-900 truncate">{workout.workout.focus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Exercises</p>
              <p className="font-bold text-neutral-900">{workout.workout.exercises.length}</p>
            </div>
          </div>
        </div>

        {/* Exercise preview */}
        <div className="mb-6">
          <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <span>Exercise Preview</span>
            <span className="text-xs text-neutral-500">({workout.workout.exercises.length} total)</span>
          </h3>
          <div className="space-y-2">
            {workout.workout.exercises.slice(0, 4).map((exercise, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{exercise.name}</p>
                    <p className="text-xs text-neutral-500">
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.reps && ` × ${exercise.reps} reps`}
                      {exercise.duration_seconds && ` • ${formatDuration(exercise.duration_seconds)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {exercise.target_muscles.slice(0, 2).map((muscle, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {workout.workout.exercises.length > 4 && (
              <div className="text-center py-2">
                <p className="text-sm text-neutral-500">
                  + {workout.workout.exercises.length - 4} more exercises
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {!isCompleted && (
          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5 fill-white" />
            <span className="text-lg">Start Workout</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {isCompleted && (
          <div className="bg-success-100 border-2 border-success-300 rounded-xl p-4 text-center">
            <p className="text-success-800 font-semibold">
              🎉 Great work! You earned {xpToEarn} XP today!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
