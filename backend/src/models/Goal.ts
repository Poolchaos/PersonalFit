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

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Goal Type determines how progress is calculated
 * - decrease: Start > Current > Target (e.g., weight loss: 165kg → 95kg)
 * - increase: Start < Current < Target (e.g., muscle gain: 70kg → 80kg)
 * - target: Hit a specific milestone (e.g., run 5k under 25min)
 * - accumulate: Count up (e.g., complete 100 workouts)
 */
export type GoalType = 'decrease' | 'increase' | 'target' | 'accumulate';

/**
 * Goal Category for organization and auto-update logic
 */
export type GoalCategory =
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'body_composition'
  | 'workout_frequency'
  | 'habit'
  | 'general';

/**
 * Goal Status
 */
export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'paused';

export interface IGoal extends Document {
  user_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: GoalType;
  category: GoalCategory;

  // Values
  initial_value: number;
  current_value: number;
  target_value: number;
  unit: string;

  // Dates
  start_date: Date;
  target_date?: Date;
  completed_date?: Date;

  // Status
  status: GoalStatus;

  // Progress tracking
  progress_percentage: number;
  last_updated: Date;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['decrease', 'increase', 'target', 'accumulate'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'body_composition',
        'workout_frequency',
        'habit',
        'general',
      ],
      required: true,
    },
    initial_value: {
      type: Number,
      required: true,
    },
    current_value: {
      type: Number,
      required: true,
    },
    target_value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    start_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    target_date: {
      type: Date,
    },
    completed_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned', 'paused'],
      default: 'active',
    },
    progress_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for user queries
GoalSchema.index({ user_id: 1, status: 1 });
GoalSchema.index({ user_id: 1, category: 1 });

/**
 * Calculate progress percentage based on goal type
 */
GoalSchema.methods.calculateProgress = function (): number {
  const { type, initial_value, current_value, target_value } = this;

  if (type === 'decrease') {
    // For decrease goals: progress = (initial - current) / (initial - target)
    // Example: Weight loss from 165kg to 95kg
    // If currently 150kg: (165 - 150) / (165 - 95) = 15/70 = 21.4%
    const totalChange = initial_value - target_value;
    const currentChange = initial_value - current_value;
    if (totalChange <= 0) return 0;
    return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
  } else if (type === 'increase') {
    // For increase goals: progress = (current - initial) / (target - initial)
    // Example: Muscle gain from 70kg to 80kg
    // If currently 75kg: (75 - 70) / (80 - 70) = 5/10 = 50%
    const totalChange = target_value - initial_value;
    const currentChange = current_value - initial_value;
    if (totalChange <= 0) return 0;
    return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
  } else if (type === 'target') {
    // For target goals: either achieved (100%) or not (0%)
    // Or can be a percentage if current_value represents progress
    return current_value >= target_value ? 100 : (current_value / target_value) * 100;
  } else if (type === 'accumulate') {
    // For accumulation goals: current / target
    // Example: Complete 100 workouts, currently at 45
    return Math.min(100, (current_value / target_value) * 100);
  }

  return 0;
};

/**
 * Update progress and check if goal is completed
 */
GoalSchema.methods.updateProgress = function (): void {
  this.progress_percentage = this.calculateProgress();
  this.last_updated = new Date();

  // Auto-complete goal if target reached
  if (this.status === 'active' && this.progress_percentage >= 100) {
    this.status = 'completed';
    this.completed_date = new Date();
  }
};

// Pre-save hook to calculate progress
GoalSchema.pre('save', function (next) {
  if (this.isModified('current_value') || this.isModified('target_value')) {
    const { type, initial_value, current_value, target_value } = this;
    
    // Calculate progress inline
    let progressPercentage = 0;
    if (type === 'decrease') {
      const totalChange = initial_value - target_value;
      const currentChange = initial_value - current_value;
      if (totalChange > 0) {
        progressPercentage = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
      }
    } else if (type === 'increase') {
      const totalChange = target_value - initial_value;
      const currentChange = current_value - initial_value;
      if (totalChange > 0) {
        progressPercentage = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
      }
    } else if (type === 'target') {
      progressPercentage = current_value >= target_value ? 100 : (current_value / target_value) * 100;
    } else if (type === 'accumulate') {
      progressPercentage = Math.min(100, (current_value / target_value) * 100);
    }
    
    this.progress_percentage = progressPercentage;
    this.last_updated = new Date();

    // Auto-complete goal if target reached
    if (this.status === 'active' && this.progress_percentage >= 100) {
      this.status = 'completed';
      this.completed_date = new Date();
    }
  }
  next();
});

const Goal = mongoose.model<IGoal>('Goal', GoalSchema);

export default Goal;
