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

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutPlan } from '../../types';

interface VolumeChartProps {
  workouts: WorkoutPlan[];
}

export default function VolumeChart({ workouts }: VolumeChartProps) {
  // Calculate volume (sets Ã— reps) for each workout
  // Note: Now calculating from weekly_schedule in workout plans
  const chartData = workouts
    .flatMap(plan => {
      if (!plan.plan_data?.weekly_schedule) return [];

      return plan.plan_data.weekly_schedule
        .filter(day => day.workout)
        .map(day => {
          const totalVolume = day.workout!.exercises.reduce((sum, exercise) => {
            const volume = (exercise.sets || 0) * (exercise.reps || 0);
            return sum + volume;
          }, 0);

          return {
            name: day.workout!.name,
            date: new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: totalVolume,
          };
        });
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
