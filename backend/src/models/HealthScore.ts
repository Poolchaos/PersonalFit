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

export interface IHealthScore extends Document {
  user_id: mongoose.Types.ObjectId;
  score_date: Date;
  total_score: number;
  pillars: {
    fitness?: number;
    diet?: number;
    habits?: number;
    meds?: number;
    mental?: number;
  };
  reasons: string[];
  created_at: Date;
  updated_at: Date;
}

const healthScoreSchema = new Schema<IHealthScore>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score_date: { type: Date, required: true },
    total_score: { type: Number, required: true },
    pillars: {
      fitness: { type: Number },
      diet: { type: Number },
      habits: { type: Number },
      meds: { type: Number },
      mental: { type: Number },
    },
    reasons: { type: [String], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

healthScoreSchema.index({ user_id: 1, score_date: 1 }, { unique: true });

const HealthScore = mongoose.model<IHealthScore>('HealthScore', healthScoreSchema);

export default HealthScore;
