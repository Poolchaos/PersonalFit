import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutPlan } from '../../types';

interface VolumeChartProps {
  workouts: WorkoutPlan[];
}

export default function VolumeChart({ workouts }: VolumeChartProps) {
  // Calculate volume (sets × reps) for each workout
  // Note: Weight data not in WorkoutPlan, would need WorkoutSession data
  const chartData = workouts
    .map(workout => {
      const totalVolume = workout.exercises.reduce((sum, exercise) => {
        const volume = (exercise.sets || 0) * (exercise.reps || 0);
        return sum + volume;
      }, 0);

      return {
        name: workout.workout_name,
        date: new Date(workout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: totalVolume,
      };
    })
    .filter(w => w.volume > 0) // Only show workouts with volume data
    .slice(-30); // Last 30 workouts

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No workout data yet.</p>
        <p className="text-sm mt-1">Complete workouts to see your total volume progression.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'Volume (reps)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '14px'
          }}
          formatter={(value: number) => [`${value} reps`, 'Total Volume']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Bar 
          dataKey="volume" 
          fill="#8b5cf6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
