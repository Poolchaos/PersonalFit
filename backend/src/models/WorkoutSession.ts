/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutSession extends Document {
  user_id: mongoose.Types.ObjectId;
  plan_id?: mongoose.Types.ObjectId;
  session_date: Date;
  planned_duration_minutes?: number;
  actual_duration_minutes?: number;
  completion_status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  completion_percentage?: number;
  exercises_planned?: number;
  exercises_completed?: number;
  notes?: string;
  mood_before?: 'great' | 'good' | 'okay' | 'tired' | 'unmotivated';
  mood_after?: 'energized' | 'accomplished' | 'satisfied' | 'exhausted' | 'disappointed';
  perceived_difficulty?: number; // 1-10 scale
  xp_awarded?: boolean; // Idempotency flag to prevent double XP awards
  xp_awarded_at?: Date; // When XP was awarded
  created_at: Date;
  updated_at: Date;
}

const workoutSessionSchema = new Schema<IWorkoutSession>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      index: true,
    },
    session_date: {
      type: Date,
      required: true,
      index: true,
    },
    planned_duration_minutes: {
      type: Number,
      min: 0,
    },
    actual_duration_minutes: {
      type: Number,
      min: 0,
    },
    completion_status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'skipped'],
      default: 'planned',
      required: true,
      index: true,
    },
    completion_percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    exercises_planned: {
      type: Number,
      min: 0,
    },
    exercises_completed: {
      type: Number,
      min: 0,
    },
    notes: String,
    mood_before: {
      type: String,
      enum: ['great', 'good', 'okay', 'tired', 'unmotivated'],
    },
    mood_after: {
      type: String,
      enum: ['energized', 'accomplished', 'satisfied', 'exhausted', 'disappointed'],
    },
    perceived_difficulty: {
      type: Number,
      min: 1,
      max: 10,
    },
    xp_awarded: {
      type: Boolean,
      default: false,
      index: true,
    },
    xp_awarded_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes for efficient queries
workoutSessionSchema.index({ user_id: 1, session_date: -1 });
workoutSessionSchema.index({ user_id: 1, completion_status: 1, session_date: -1 });
workoutSessionSchema.index({ user_id: 1, plan_id: 1, session_date: -1 });

export default mongoose.model<IWorkoutSession>('WorkoutSession', workoutSessionSchema);
