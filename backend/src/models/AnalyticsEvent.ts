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

export interface IAnalyticsEvent extends Document {
  user_id: mongoose.Types.ObjectId;
  event_name: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event_name: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
