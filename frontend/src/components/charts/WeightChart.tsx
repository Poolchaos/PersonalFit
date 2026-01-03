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

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BodyMetrics } from '../../types';

interface WeightChartProps {
  metrics: BodyMetrics[];
}

export default function WeightChart({ metrics }: WeightChartProps) {
  // Transform metrics data for chart
  const chartData = metrics
    .filter(m => m.weight_kg)
    .map(m => ({
      date: new Date(m.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weight_kg,
    }))
    .reverse(); // Show oldest to newest

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No weight data yet.</p>
        <p className="text-sm mt-1">Add your first measurement above to see your progress chart.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '14px'
          }}
          formatter={(value: number) => [`${value} kg`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
