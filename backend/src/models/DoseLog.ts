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

export interface IDoseLog extends Document {
  user_id: mongoose.Types.ObjectId;
  medication_id: mongoose.Types.ObjectId;
  
  // When it was scheduled vs taken
  scheduled_time: Date;
  taken_at?: Date;
  
  // Status
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  
  // Context
  dosage_amount?: number;  // In case they took a different amount
  notes?: string;
  side_effects?: string[];
  
  // For correlations
  mood_before?: 1 | 2 | 3 | 4 | 5;
  mood_after?: 1 | 2 | 3 | 4 | 5;
  energy_before?: 1 | 2 | 3 | 4 | 5;
  energy_after?: 1 | 2 | 3 | 4 | 5;
  
  created_at: Date;
  updated_at: Date;
}

const doseLogSchema = new Schema<IDoseLog>(
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
    scheduled_time: {
      type: Date,
      required: true,
    },
    taken_at: Date,
    status: {
      type: String,
      enum: ['pending', 'taken', 'skipped', 'missed'],
      default: 'pending',
      index: true,
    },
    dosage_amount: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    side_effects: [{
      type: String,
      trim: true,
    }],
    mood_before: {
      type: Number,
      min: 1,
      max: 5,
    },
    mood_after: {
      type: Number,
      min: 1,
      max: 5,
    },
    energy_before: {
      type: Number,
      min: 1,
      max: 5,
    },
    energy_after: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound indexes for common queries
doseLogSchema.index({ user_id: 1, scheduled_time: -1 });
doseLogSchema.index({ medication_id: 1, scheduled_time: -1 });
doseLogSchema.index({ user_id: 1, status: 1, scheduled_time: -1 });

// Prevent duplicate logs for same medication at same scheduled time
doseLogSchema.index(
  { medication_id: 1, scheduled_time: 1 },
  { unique: true }
);

export const DoseLog = mongoose.model<IDoseLog>('DoseLog', doseLogSchema);
