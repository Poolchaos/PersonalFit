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

export interface NutritionItem {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface INutritionEvent extends Document {
  user_id: mongoose.Types.ObjectId;
  source: 'vision' | 'manual' | 'meal_plan';
  meal_title?: string;
  consumed_at: Date;
  calories?: number;
  macros?: {
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  };
  items: NutritionItem[];
  created_at: Date;
  updated_at: Date;
}

const nutritionItemSchema = new Schema<NutritionItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number },
    unit: { type: String, trim: true },
  },
  { _id: false }
);

const nutritionEventSchema = new Schema<INutritionEvent>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['vision', 'manual', 'meal_plan'], required: true },
    meal_title: { type: String, trim: true },
    consumed_at: { type: Date, required: true },
    calories: { type: Number },
    macros: {
      protein_g: { type: Number },
      carbs_g: { type: Number },
      fat_g: { type: Number },
    },
    items: { type: [nutritionItemSchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const NutritionEvent = mongoose.model<INutritionEvent>('NutritionEvent', nutritionEventSchema);

export default NutritionEvent;
