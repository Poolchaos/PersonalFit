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

import mongoose, { Schema, Document } from 'mongoose';

export interface IBodyMetrics extends Document {
  user_id: mongoose.Types.ObjectId;
  measurement_date: Date;
  weight_kg?: number;
  body_fat_percentage?: number;
  measurements?: {
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    thigh_left_cm?: number;
    thigh_right_cm?: number;
    bicep_left_cm?: number;
    bicep_right_cm?: number;
    calf_left_cm?: number;
    calf_right_cm?: number;
    shoulders_cm?: number;
    forearm_left_cm?: number;
    forearm_right_cm?: number;
  };
  progress_photos?: {
    front_url?: string;
    side_url?: string;
    back_url?: string;
  };
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const bodyMetricsSchema = new Schema<IBodyMetrics>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    measurement_date: {
      type: Date,
      required: true,
      index: true,
    },
    weight_kg: {
      type: Number,
      min: 20,
      max: 500,
    },
    body_fat_percentage: {
      type: Number,
      min: 1,
      max: 70,
    },
    measurements: {
      chest_cm: {
        type: Number,
        min: 0,
        max: 300,
      },
      waist_cm: {
        type: Number,
        min: 0,
        max: 300,
      },
      hips_cm: {
        type: Number,
        min: 0,
        max: 300,
      },
      thigh_left_cm: {
        type: Number,
        min: 0,
        max: 200,
      },
      thigh_right_cm: {
        type: Number,
        min: 0,
        max: 200,
      },
      bicep_left_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
      bicep_right_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
      calf_left_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
      calf_right_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
      shoulders_cm: {
        type: Number,
        min: 0,
        max: 300,
      },
      forearm_left_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
      forearm_right_cm: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    progress_photos: {
      front_url: String,
      side_url: String,
      back_url: String,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Index for efficient querying by user and date range
bodyMetricsSchema.index({ user_id: 1, measurement_date: -1 });

// Prevent duplicate entries for same user and date
bodyMetricsSchema.index(
  { user_id: 1, measurement_date: 1 },
  {
    unique: true,
    partialFilterExpression: { measurement_date: { $exists: true } }
  }
);

const BodyMetrics = mongoose.model<IBodyMetrics>('BodyMetrics', bodyMetricsSchema);

export default BodyMetrics;
