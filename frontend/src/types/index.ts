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

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_goals?: string[];
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  medical_conditions?: string[];
  injuries?: string[];
  injuries_and_restrictions?: string;
  current_activities?: string;
  onboarding_medications_notes?: string;
}

export interface UserPreferences {
  preferred_workout_days?: string[];
  preferred_workout_duration?: number;
  preferred_workout_types?: string[];
  equipment_access?: string[];
  habits_enabled?: boolean;
  diet_ai_enabled?: boolean;
  mental_wellness_enabled?: boolean;
  unified_health_score_enabled?: boolean;
  ai_vision_enabled?: boolean;
  ai_recommendations_enabled?: boolean;
  ai_habit_suggestions_enabled?: boolean;
  vision_image_retention?: 'delete' | 'keep';
}

export interface HabitEntry {
  habit_key: string;
  category: 'good' | 'bad';
  status: 'completed' | 'missed' | 'skipped';
  value?: number;
  unit?: string;
  notes?: string;
}

export interface HabitLog {
  _id: string;
  user_id: string;
  log_date: string;
  entries: HabitEntry[];
  created_at: string;
  updated_at: string;
}

export interface VisionItem {
  name: string;
  quantity: string;
  unit: string;
  category: 'protein' | 'vegetable' | 'fruit' | 'grain' | 'dairy' | 'snack' | 'beverage' | 'other';
  freshness_estimate?: 'fresh' | 'moderate' | 'expiring_soon';
  confidence: number;
  confirmed: boolean;
}

export interface VisionScan {
  _id: string;
  user_id: string;
  source: 'fridge' | 'grocery' | 'receipt';
  image_url: string;
  status: 'pending' | 'confirmed' | 'failed';
  items: VisionItem[];
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionItem {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface NutritionEvent {
  _id: string;
  user_id: string;
  source: 'vision' | 'manual' | 'meal_plan';
  meal_title?: string;
  consumed_at: string;
  calories?: number;
  macros?: {
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  };
  items: NutritionItem[];
  created_at: string;
  updated_at: string;
}

export interface HealthScore {
  _id: string;
  user_id: string;
  score_date: string;
  total_score: number;
  pillars?: {
    fitness?: number;
    diet?: number;
    habits?: number;
    meds?: number;
    mental?: number;
  };
  reasons?: string[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  confirmPassword?: string;
}

export interface EquipmentSpecifications {
  weight_kg?: number;
  weight_lbs?: number;
  resistance_level?: string;
  size?: string;
  brand?: string;
  model?: string;
  max_weight_capacity_kg?: number;
  [key: string]: string | number | undefined;
}

export interface Equipment {
  _id: string;
  user_id: string;
  equipment_name: string;
  equipment_type: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance_bands' | 'other';
  quantity: number;
  specifications?: EquipmentSpecifications;
  condition: 'new' | 'good' | 'fair' | 'poor';
  is_available: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BodyMetrics {
  _id: string;
  user_id: string;
  measurement_date: string;
  weight_kg?: number;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  measurements?: {
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    left_arm_cm?: number;
    right_arm_cm?: number;
    left_thigh_cm?: number;
    right_thigh_cm?: number;
  };
  progress_photos?: {
    front_url?: string;
    side_url?: string;
    back_url?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleExercise {
  name: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  target_muscles: string[];
  equipment_needed?: string[];
  instructions?: string;
}

export interface ScheduleWorkout {
  name: string;
  duration_minutes: number;
  focus: string;
  type?: string;
  exercises: ScheduleExercise[];
}

export interface ScheduleDay {
  day: string;
  workout?: ScheduleWorkout;
}

export interface WorkoutPlan {
  _id: string;
  user_id: string;
  plan_data: {
    plan_overview: {
      program_name: string;
      program_description?: string;
      duration_weeks: number;
      sessions_per_week: number;
      equipment_required: string[];
      fitness_level: string;
      primary_goals: string[];
      training_methodology?: string;
    };
    weekly_schedule: ScheduleDay[];
    progression_notes?: string;
    warm_up_routine?: string;
    cool_down_routine?: string;
  };
  generation_context?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  exercise_name: string;
  muscle_groups: string[];
  equipment_needed?: string[];
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface WorkoutSession {
  _id: string;
  user_id: string;
  workout_id?: string;
  session_date: string;
  duration_minutes: number;
  exercises_completed: ExerciseLog[];
  completion_status?: 'planned' | 'completed' | 'skipped' | 'partial';
  actual_duration_minutes?: number;
  exercises_planned?: number;
  notes?: string;
  intensity_level?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseLog {
  exercise_name: string;
  sets_completed: SetLog[];
  notes?: string;
}

export interface SetLog {
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  rest_seconds?: number;
}

export interface AccountabilityStatus {
  streak: {
    current: number;
    longest: number;
    freezes_available?: number;
    freezes_used?: number;
  };
  totals: {
    workouts_completed: number;
    workouts_missed: number;
    penalties_assigned: number;
    penalties_unresolved: number;
  };
  current_week: {
    week_start: string;
    workouts_planned: number;
    workouts_completed: number;
    workouts_missed: number;
    completion_rate: number;
  };
  recent_penalties: Penalty[];
}

export interface Penalty {
  _id: string;
  user_id: string;
  missed_date: string;
  workout_type?: string;
  penalty_type: string;
  description: string;
  completed: boolean;
  completed_date?: string;
  evidence_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoUploadResponse {
  message: string;
  photo: {
    url: string;
    filename: string;
    type: 'front' | 'side' | 'back';
  };
}

export interface ProgressStats {
  overall: {
    total_sessions: number;
    completed_sessions: number;
    completion_rate: number;
    total_exercises: number;
    total_volume_kg: number;
    total_workout_time_minutes: number;
    current_streak_days: number;
    longest_streak_days: number;
    average_session_duration: number;
  };
  recent_performance: {
    last_7_days: {
      sessions: number;
      completion_rate: number;
      average_difficulty: number;
    };
    last_30_days: {
      sessions: number;
      completion_rate: number;
      average_difficulty: number;
    };
  };
  personal_records: Array<{
    exercise_name: string;
    record_type: string;
    value: number;
    unit: string;
    achieved_date: string;
  }>;
  exercise_history: Array<{
    exercise_name: string;
    total_sessions: number;
    total_volume_kg: number;
    max_weight_kg: number;
    max_reps: number;
    last_performed: string;
  }>;
}

// Medication types
export interface Medication {
  _id: string;
  user_id: string;
  name: string;
  type: 'prescription' | 'supplement' | 'otc';
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };
  frequency: {
    times_per_day: number;
    specific_times?: string[];
    days_of_week?: number[];
    with_food?: boolean;
    notes?: string;
  };
  inventory: {
    current_count: number;
    refill_threshold: number;
    last_refill_date?: string;
  };
  health_tags: string[];
  warnings: string[];
  affects_metrics: string[];
  bottle_image_url?: string;
  manually_verified: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DoseLog {
  _id: string;
  user_id: string;
  medication_id: string;
  scheduled_time: string;
  taken_at?: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  dosage_amount?: number;
  notes?: string;
  side_effects?: string[];
  mood_before?: 1 | 2 | 3 | 4 | 5;
  mood_after?: 1 | 2 | 3 | 4 | 5;
  energy_before?: 1 | 2 | 3 | 4 | 5;
  energy_after?: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  updated_at: string;
}

export interface TodaysDose {
  scheduled_time: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  log?: DoseLog;
}

export interface TodaysMedication {
  medication: Medication;
  doses: TodaysDose[];
}

export interface AdherenceStats {
  total_scheduled: number;
  total_taken: number;
  total_skipped: number;
  total_missed: number;
  adherence_rate: number;
  current_streak: number;
  longest_streak: number;
}

export interface CreateMedicationInput {
  name: string;
  type: 'prescription' | 'supplement' | 'otc';
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };
  frequency: {
    times_per_day: number;
    specific_times?: string[];
    days_of_week?: number[];
    with_food?: boolean;
    notes?: string;
  };
  inventory?: {
    current_count: number;
    refill_threshold?: number;
  };
  health_tags?: string[];
  warnings?: string[];
  affects_metrics?: string[];
  start_date?: string;
  end_date?: string;
}

export interface LogDoseInput {
  scheduled_time: string;
  status: 'taken' | 'skipped';
  taken_at?: string;
  dosage_amount?: number;
  notes?: string;
  side_effects?: string[];
  mood_before?: 1 | 2 | 3 | 4 | 5;
  mood_after?: 1 | 2 | 3 | 4 | 5;
  energy_before?: 1 | 2 | 3 | 4 | 5;
  energy_after?: 1 | 2 | 3 | 4 | 5;
}

// Adherence Types
export interface DailyAdherence {
  date: string;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
  percentage: number;
}

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
  percentage: number;
}

export interface AdherenceStreak {
  current: number;
  longest: number;
  lastPerfectDay: string | null;
}

export interface TimePatternInsight {
  pattern: 'morning' | 'afternoon' | 'evening' | 'night';
  missedCount: number;
  totalCount: number;
  missedPercentage: number;
}

export interface AdherenceInsight {
  type: 'time_pattern' | 'day_pattern' | 'medication_specific' | 'streak' | 'improvement' | 'declining';
  severity: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  suggestion?: string;
  actionType?: 'change_time' | 'set_reminder' | 'view_medication';
  actionData?: Record<string, unknown>;
}

export interface AdherenceOverview {
  weeklyAdherence: DailyAdherence[];
  monthlyAdherence: DailyAdherence[];
  medicationAdherence: MedicationAdherence[];
  streak: AdherenceStreak;
  overallStats: {
    thisWeek: { taken: number; total: number; percentage: number };
    thisMonth: { taken: number; total: number; percentage: number };
    allTime: { taken: number; total: number; percentage: number };
  };
  insights: AdherenceInsight[];
}

export interface MedicationAdherenceDetails {
  medication: Medication | null;
  dailyAdherence: DailyAdherence[];
  stats: MedicationAdherence | null;
  timePatterns: TimePatternInsight[];
}
