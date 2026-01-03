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
 * Daily Challenge Model
 * Provides rotating daily challenges for engagement
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyChallenge extends Document {
  user_id: mongoose.Types.ObjectId;
  challenge_date: Date;
  challenges: {
    id: string;
    type: 'workout' | 'exercise' | 'streak' | 'social' | 'exploration';
    title: string;
    description: string;
    target: number;
    progress: number;
    xp_reward: number;
    gems_reward: number;
    completed: boolean;
    completed_at?: Date;
  }[];
  streak_freeze_used: boolean;
  gems_earned_today: number;
  created_at: Date;
  updated_at: Date;
}

const dailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challenge_date: {
      type: Date,
      required: true,
    },
    challenges: [{
      id: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['workout', 'exercise', 'streak', 'social', 'exploration'],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      target: {
        type: Number,
        required: true,
        default: 1,
      },
      progress: {
        type: Number,
        default: 0,
      },
      xp_reward: {
        type: Number,
        required: true,
      },
      gems_reward: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completed_at: Date,
    }],
    streak_freeze_used: {
      type: Boolean,
      default: false,
    },
    gems_earned_today: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for unique daily challenges per user
dailyChallengeSchema.index({ user_id: 1, challenge_date: 1 }, { unique: true });

const DailyChallenge = mongoose.model<IDailyChallenge>('DailyChallenge', dailyChallengeSchema);

export default DailyChallenge;
