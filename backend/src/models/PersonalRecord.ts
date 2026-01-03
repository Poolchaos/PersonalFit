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

/**
 * Personal Record (PR) Model
 * Tracks user's personal bests for exercises
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalRecord extends Document {
  user_id: mongoose.Types.ObjectId;
  exercise_name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'endurance';
  record_type: 'weight' | 'reps' | 'time' | 'distance';
  value: number;
  unit: string;
  previous_value?: number;
  improvement_percentage?: number;
  achieved_at: Date;
  workout_session_id?: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const personalRecordSchema = new Schema<IPersonalRecord>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exercise_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'endurance'],
      required: true,
    },
    record_type: {
      type: String,
      enum: ['weight', 'reps', 'time', 'distance'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      default: 'kg',
    },
    previous_value: {
      type: Number,
    },
    improvement_percentage: {
      type: Number,
    },
    achieved_at: {
      type: Date,
      default: Date.now,
    },
    workout_session_id: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for efficient lookups
personalRecordSchema.index({ user_id: 1, exercise_name: 1, record_type: 1 });
personalRecordSchema.index({ user_id: 1, achieved_at: -1 });

const PersonalRecord = mongoose.model<IPersonalRecord>('PersonalRecord', personalRecordSchema);

export default PersonalRecord;
