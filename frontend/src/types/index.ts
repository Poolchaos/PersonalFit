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
  current_activities?: string;
}

export interface UserPreferences {
  preferred_workout_days?: string[];
  preferred_workout_duration?: number;
  preferred_workout_types?: string[];
  equipment_access?: string[];
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

export interface Equipment {
  _id: string;
  user_id: string;
  equipment_name: string;
  equipment_type: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance_bands' | 'other';
  quantity: number;
  specifications?: Record<string, any>;
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

export interface WorkoutPlan {
  _id: string;
  user_id: string;
  workout_name: string;
  description?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  workout_type: string;
  exercises: Exercise[];
  ai_generated: boolean;
  ai_provider?: string;
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
