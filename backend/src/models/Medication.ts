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

export interface IMedication extends Document {
  user_id: mongoose.Types.ObjectId;
  name: string;
  type: 'prescription' | 'supplement' | 'otc';

  // Dosage
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };

  // Schedule
  frequency: {
    times_per_day: number;
    specific_times?: string[];  // ["08:00", "20:00"]
    days_of_week?: number[];    // [0,1,2,3,4,5,6] = every day
    with_food?: boolean;
    notes?: string;
  };

  // Inventory
  inventory: {
    current_count: number;
    refill_threshold: number;
    last_refill_date?: Date;
  };

  // Health context
  health_tags: string[];
  warnings: string[];
  affects_metrics: string[];

  // OCR metadata (for Phase 2)
  bottle_image_url?: string;
  ocr_extracted_at?: Date;
  manually_verified: boolean;

  // Status
  is_active: boolean;
  start_date: Date;
  end_date?: Date;

  created_at: Date;
  updated_at: Date;
}

const medicationSchema = new Schema<IMedication>(
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
    },
    type: {
      type: String,
      enum: ['prescription', 'supplement', 'otc'],
      required: true,
    },
    dosage: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['mg', 'ml', 'iu', 'mcg', 'g', 'tablets', 'capsules'],
        required: true,
      },
      form: {
        type: String,
        enum: ['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'other'],
        required: true,
      },
    },
    frequency: {
      times_per_day: {
        type: Number,
        required: true,
        min: 1,
        max: 24,
      },
      specific_times: [{
        type: String,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      }],
      days_of_week: [{
        type: Number,
        min: 0,
        max: 6,
      }],
      with_food: {
        type: Boolean,
        default: false,
      },
      notes: String,
    },
    inventory: {
      current_count: {
        type: Number,
        default: 0,
        min: 0,
      },
      refill_threshold: {
        type: Number,
        default: 7,
        min: 0,
      },
      last_refill_date: Date,
    },
    health_tags: [{
      type: String,
      trim: true,
    }],
    warnings: [{
      type: String,
      trim: true,
    }],
    affects_metrics: [{
      type: String,
      enum: ['heart_rate', 'blood_pressure', 'sleep_quality', 'energy_level', 'strength', 'endurance', 'recovery', 'weight', 'mood'],
    }],
    bottle_image_url: String,
    ocr_extracted_at: Date,
    manually_verified: {
      type: Boolean,
      default: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: Date,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound index for user queries
medicationSchema.index({ user_id: 1, is_active: 1 });
medicationSchema.index({ user_id: 1, name: 1 }, { unique: true });

export const Medication = mongoose.model<IMedication>('Medication', medicationSchema);
