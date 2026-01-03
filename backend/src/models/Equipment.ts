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

export interface IEquipment extends Document {
  user_id: mongoose.Types.ObjectId;
  equipment_name: string;
  equipment_type: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'accessories' | 'other';
  quantity?: number;
  specifications?: {
    weight_kg?: number;
    adjustable?: boolean;
    min_weight_kg?: number;
    max_weight_kg?: number;
    resistance_levels?: number;
    notes?: string;
  };
  condition?: 'new' | 'good' | 'fair' | 'poor';
  purchase_date?: Date;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    equipment_name: {
      type: String,
      required: true,
      trim: true,
    },
    equipment_type: {
      type: String,
      required: true,
      enum: ['free_weights', 'machines', 'cardio', 'bodyweight', 'accessories', 'other'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    specifications: {
      weight_kg: Number,
      adjustable: Boolean,
      min_weight_kg: Number,
      max_weight_kg: Number,
      resistance_levels: Number,
      notes: String,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor'],
    },
    purchase_date: Date,
    is_available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Index for efficient equipment queries by user
equipmentSchema.index({ user_id: 1, equipment_type: 1 });

// Unique compound index to prevent duplicate equipment per user
equipmentSchema.index({ user_id: 1, equipment_name: 1 }, { unique: true });

export default mongoose.model<IEquipment>('Equipment', equipmentSchema);
