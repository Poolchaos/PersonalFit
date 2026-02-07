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

export interface VisionItem {
  name: string;
  quantity?: number;
  unit?: string;
  confidence?: number;
  confirmed?: boolean;
}

export interface IVisionScan extends Document {
  user_id: mongoose.Types.ObjectId;
  source: 'fridge' | 'grocery' | 'receipt';
  image_url: string;
  status: 'pending' | 'confirmed' | 'failed';
  items: VisionItem[];
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const visionItemSchema = new Schema<VisionItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number },
    unit: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 },
    confirmed: { type: Boolean, default: false },
  },
  { _id: false }
);

const visionScanSchema = new Schema<IVisionScan>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['fridge', 'grocery', 'receipt'], required: true },
    image_url: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    items: { type: [visionItemSchema], default: [] },
    processed_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const VisionScan = mongoose.model<IVisionScan>('VisionScan', visionScanSchema);

export default VisionScan;
