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

export interface IPenalty {
  _id?: mongoose.Types.ObjectId;
  assigned_date: Date;
  workout_date: Date;
  penalty_type: 'missed_workout' | 'late_completion' | 'custom';
  severity: 'light' | 'moderate' | 'severe';
  description?: string;
  resolved: boolean;
  resolved_date?: Date;
}

export interface IStreak {
  current_streak: number;
  longest_streak: number;
  last_workout_date?: Date;
  streak_start_date?: Date;
  freezes_available: number;
  freezes_used: number;
}

export interface IAccountability extends Document {
  user_id: mongoose.Types.ObjectId;
  streak: IStreak;
  penalties: IPenalty[];
  weekly_stats: {
    week_start: Date;
    workouts_planned: number;
    workouts_completed: number;
    workouts_missed: number;
    completion_rate: number;
  }[];
  total_workouts_completed: number;
  total_workouts_missed: number;
  total_penalties: number;
  created_at: Date;
  updated_at: Date;
}

const penaltySchema = new Schema({
  assigned_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  workout_date: {
    type: Date,
    required: true,
  },
  penalty_type: {
    type: String,
    enum: ['missed_workout', 'late_completion', 'custom'],
    required: true,
    default: 'missed_workout',
  },
  severity: {
    type: String,
    enum: ['light', 'moderate', 'severe'],
    required: true,
    default: 'moderate',
  },
  description: String,
  resolved: {
    type: Boolean,
    default: false,
  },
  resolved_date: Date,
});

const weeklyStatsSchema = new Schema({
  week_start: {
    type: Date,
    required: true,
  },
  workouts_planned: {
    type: Number,
    default: 0,
    min: 0,
  },
  workouts_completed: {
    type: Number,
    default: 0,
    min: 0,
  },
  workouts_missed: {
    type: Number,
    default: 0,
    min: 0,
  },
  completion_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

const accountabilitySchema = new Schema<IAccountability>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    streak: {
      current_streak: {
        type: Number,
        default: 0,
        min: 0,
      },
      longest_streak: {
        type: Number,
        default: 0,
        min: 0,
      },
      last_workout_date: Date,
      streak_start_date: Date,
      freezes_available: {
        type: Number,
        default: 2,
        min: 0,
      },
      freezes_used: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    penalties: [penaltySchema],
    weekly_stats: [weeklyStatsSchema],
    total_workouts_completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_workouts_missed: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_penalties: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Index for efficient penalty queries
accountabilitySchema.index({ 'penalties.assigned_date': -1 });
accountabilitySchema.index({ 'penalties.resolved': 1 });

// Index for weekly stats queries
accountabilitySchema.index({ 'weekly_stats.week_start': -1 });

const Accountability = mongoose.model<IAccountability>('Accountability', accountabilitySchema);

export default Accountability;
