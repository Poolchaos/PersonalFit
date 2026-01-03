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

export interface IWorkoutPlan extends Document {
  user_id: mongoose.Types.ObjectId;
  workout_modality: 'strength' | 'hiit' | 'flexibility' | 'cardio';
  plan_data: {
    plan_overview: {
      duration_weeks: number;
      sessions_per_week: number;
      focus_areas: string[];
      equipment_required: string[];
    };
    weekly_schedule: Array<{
      day: string;
      workout: {
        name: string;
        duration_minutes: number;
        focus: string;
        exercises: Array<{
          name: string;
          sets?: number;
          reps?: number;
          duration_seconds?: number;
          rest_seconds?: number;
          work_seconds?: number;
          rounds?: number;
          equipment?: string[];
          target_muscles: string[];
          instructions: string;
          modifications?: string;
        }>;
      };
    }>;
    progression_notes: string;
    safety_reminders: string[];
  };
  generation_context: {
    user_goals?: string[];
    experience_level?: string;
    equipment_used?: string[];
    workout_modality?: 'strength' | 'hiit' | 'flexibility' | 'cardio';
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workout_modality: {
      type: String,
      enum: ['strength', 'hiit', 'flexibility', 'cardio'],
      default: 'strength',
      required: true,
    },
    plan_data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generation_context: {
      user_goals: [String],
      experience_level: String,
      equipment_used: [String],
      workout_modality: {
        type: String,
        enum: ['strength', 'hiit', 'flexibility', 'cardio'],
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Index for efficient plan queries
workoutPlanSchema.index({ user_id: 1, is_active: 1, created_at: -1 });

export default mongoose.model<IWorkoutPlan>('WorkoutPlan', workoutPlanSchema);
