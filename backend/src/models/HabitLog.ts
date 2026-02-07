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

export interface HabitEntry {
  habit_key: string;
  category: 'good' | 'bad';
  status: 'completed' | 'missed' | 'skipped';
  value?: number;
  unit?: string;
  notes?: string;
}

export interface IHabitLog extends Document {
  user_id: mongoose.Types.ObjectId;
  log_date: Date;
  entries: HabitEntry[];
  created_at: Date;
  updated_at: Date;
}

const habitEntrySchema = new Schema<HabitEntry>(
  {
    habit_key: { type: String, required: true, trim: true },
    category: { type: String, enum: ['good', 'bad'], required: true },
    status: { type: String, enum: ['completed', 'missed', 'skipped'], required: true },
    value: { type: Number },
    unit: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const habitLogSchema = new Schema<IHabitLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    log_date: { type: Date, required: true },
    entries: { type: [habitEntrySchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

habitLogSchema.index({ user_id: 1, log_date: 1 }, { unique: true });

const HabitLog = mongoose.model<IHabitLog>('HabitLog', habitLogSchema);

export default HabitLog;
