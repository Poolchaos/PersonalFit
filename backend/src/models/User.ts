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
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  profile: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    height_cm?: number;
    weight_kg?: number;
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    fitness_goals?: string[];
    experience_level?: 'beginner' | 'intermediate' | 'advanced';
    medical_conditions?: string[];
    injuries?: string[];
    injuries_and_restrictions?: string; // Detailed description of injuries, impairments, and exercise restrictions
    current_activities?: string; // Description of existing regular activities (e.g., "Daily 30min uphill walk with dog")
    onboarding_medications_notes?: string; // Simple text notes from onboarding medications step
  };
  preferences: {
    preferred_workout_days?: string[];
    preferred_workout_duration?: number;
    preferred_workout_types?: string[];
    equipment_access?: string[];
    workout_frequency?: number; // Days per week user wants to workout
  };
  notification_preferences?: {
    medication_reminders: {
      enabled: boolean;
      advance_minutes: number; // Notify X minutes before dose
      escalation_minutes: number; // Remind again if not logged
      quiet_hours: {
        enabled: boolean;
        start: string; // "22:00"
        end: string; // "07:00"
      };
    };
    push_subscription?: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    };
  };
  gamification?: {
    xp: number; // Total experience points earned
    level: number; // Current level (calculated from XP)
    total_workouts_completed: number;
    current_streak: number; // Consecutive days with workouts
    longest_streak: number; // Best streak ever
    last_workout_date?: Date;
    achievements: string[]; // Array of achievement IDs earned
    // NEW: PR tracking
    total_prs: number; // Total personal records set
    // NEW: Streak freeze system
    streak_freezes_available: number; // Streak freezes user can use
    streak_freezes_used_this_month: number;
    last_streak_freeze_date?: Date;
    // NEW: Gems currency
    gems: number; // Premium currency for streak freezes, cosmetics
    total_gems_earned: number;
    // NEW: Rewards shop
    purchased_items: string[]; // Array of purchased shop item IDs
    milestone_rewards_claimed: string[]; // Array of claimed milestone reward IDs
  };
  ai_config?: {
    provider: 'openai' | 'anthropic' | 'local' | 'custom';
    api_key_encrypted?: string;
    model?: string;
    endpoint_url?: string; // For local/custom LLMs
    enabled: boolean;
  };
  created_at: Date;
  updated_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password_hash: {
      type: String,
      required: true,
    },
    profile: {
      first_name: String,
      last_name: String,
      date_of_birth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      height_cm: Number,
      weight_kg: Number,
      activity_level: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      },
      fitness_goals: [String],
      experience_level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      medical_conditions: [String],
      injuries: [String],
      injuries_and_restrictions: String,
      current_activities: String,
      onboarding_medications_notes: String,
    },
    preferences: {
      preferred_workout_days: [String],
      preferred_workout_duration: Number,
      preferred_workout_types: [String],
      equipment_access: [String],
      workout_frequency: Number, // Days per week user wants to workout
    },
    notification_preferences: {
      medication_reminders: {
        enabled: {
          type: Boolean,
          default: true,
        },
        advance_minutes: {
          type: Number,
          default: 15, // Notify 15 minutes before dose
        },
        escalation_minutes: {
          type: Number,
          default: 30, // Remind again after 30 minutes if not logged
        },
        quiet_hours: {
          enabled: {
            type: Boolean,
            default: false,
          },
          start: {
            type: String,
            default: '22:00',
          },
          end: {
            type: String,
            default: '07:00',
          },
        },
      },
      push_subscription: {
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String,
        },
      },
    },
    gamification: {
      xp: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
      total_workouts_completed: {
        type: Number,
        default: 0,
      },
      current_streak: {
        type: Number,
        default: 0,
      },
      longest_streak: {
        type: Number,
        default: 0,
      },
      last_workout_date: Date,
      achievements: {
        type: [String],
        default: [],
      },
      // NEW: PR tracking
      total_prs: {
        type: Number,
        default: 0,
      },
      // NEW: Streak freeze system
      streak_freezes_available: {
        type: Number,
        default: 2, // Start with 2 free freezes
      },
      streak_freezes_used_this_month: {
        type: Number,
        default: 0,
      },
      last_streak_freeze_date: Date,
      // NEW: Gems currency
      gems: {
        type: Number,
        default: 50, // Start with 50 gems
      },
      total_gems_earned: {
        type: Number,
        default: 50,
      },
      // NEW: Rewards shop
      purchased_items: {
        type: [String],
        default: [],
      },
      milestone_rewards_claimed: {
        type: [String],
        default: [],
      },
    },
    ai_config: {
      provider: {
        type: String,
        enum: ['openai', 'anthropic', 'local', 'custom'],
        default: 'openai',
      },
      api_key_encrypted: {
        type: String,
        select: false, // Never return in queries by default
      },
      model: String,
      endpoint_url: String, // For local/custom LLMs
      enabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

export default mongoose.model<IUser>('User', userSchema);
