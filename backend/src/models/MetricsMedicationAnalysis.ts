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

import { Schema, model, Document } from 'mongoose';
import type { ObjectId } from 'mongodb';

export interface IMetricsMedicationAnalysis extends Document {
  user_id: ObjectId;
  medication_id: ObjectId;
  metric: string; // heart_rate, blood_pressure, energy_level, sleep_quality, etc.
  correlation_coefficient: number; // -1 to 1
  impact_direction: 'positive' | 'negative' | 'neutral';
  data_points: number;
  confidence_level: number; // 0 to 1
  observations: string[];
  sample_period_days: number;
  created_at: Date;
  updated_at: Date;
}

const analyzeSchema = new Schema<IMetricsMedicationAnalysis>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    medication_id: {
      type: Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true,
    },
    metric: {
      type: String,
      required: true,
      enum: [
        'heart_rate',
        'blood_pressure',
        'sleep_quality',
        'energy_level',
        'strength',
        'endurance',
        'recovery',
        'weight',
        'mood',
      ],
    },
    correlation_coefficient: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    impact_direction: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true,
    },
    data_points: {
      type: Number,
      required: true,
      default: 0,
    },
    confidence_level: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    observations: [
      {
        type: String,
      },
    ],
    sample_period_days: {
      type: Number,
      required: true,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + medication analysis
analyzeSchema.index({ user_id: 1, medication_id: 1 });
analyzeSchema.index({ user_id: 1, metric: 1 });

export default model<IMetricsMedicationAnalysis>(
  'MetricsMedicationAnalysis',
  analyzeSchema
);
