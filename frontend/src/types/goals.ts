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

export type GoalType = 'decrease' | 'increase' | 'target' | 'accumulate';

export type GoalCategory =
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'body_composition'
  | 'workout_frequency'
  | 'habit'
  | 'general';

export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'paused';

export interface Goal {
  _id: string;
  user_id: string;
  name: string;
  description?: string;
  type: GoalType;
  category: GoalCategory;
  initial_value: number;
  current_value: number;
  target_value: number;
  unit: string;
  start_date: string;
  target_date?: string;
  completed_date?: string;
  status: GoalStatus;
  progress_percentage: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  type: GoalType;
  category: GoalCategory;
  initial_value: number;
  current_value?: number;
  target_value: number;
  unit: string;
  target_date?: string;
}

export interface UpdateGoalInput {
  name?: string;
  description?: string;
  type?: GoalType;
  category?: GoalCategory;
  initial_value?: number;
  current_value?: number;
  target_value?: number;
  unit?: string;
  target_date?: string;
  status?: GoalStatus;
}

export interface GoalStats {
  total: number;
  active: number;
  completed: number;
  abandoned: number;
  paused: number;
  average_progress: number;
}
