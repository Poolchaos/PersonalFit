import mongoose, { Schema, Document } from 'mongoose';

export interface IExerciseLog extends Document {
  session_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  exercise_name: string;
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'hiit' | 'other';
  sets_completed?: number;
  target_sets?: number;
  set_details?: Array<{
    set_number: number;
    reps?: number;
    target_reps?: number;
    weight_kg?: number;
    duration_seconds?: number;
    distance_meters?: number;
    rest_seconds?: number;
    completed: boolean;
    form_rating?: number; // 1-5 scale
    notes?: string;
  }>;
  interval_structure?: {
    work_seconds: number;
    rest_seconds: number;
    rounds: number;
    rounds_completed?: number;
  };
  equipment_used?: string[];
  target_muscles: string[];
  total_volume_kg?: number; // sets × reps × weight
  total_duration_seconds?: number;
  personal_record?: boolean;
  difficulty_rating?: number; // 1-10 scale
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const exerciseLogSchema = new Schema<IExerciseLog>(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: 'WorkoutSession',
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exercise_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    exercise_type: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'balance', 'hiit', 'other'],
      default: 'strength',
      required: true,
    },
    sets_completed: {
      type: Number,
      min: 0,
    },
    target_sets: {
      type: Number,
      min: 0,
    },
    set_details: [
      {
        set_number: {
          type: Number,
          required: true,
          min: 1,
        },
        reps: Number,
        target_reps: Number,
        weight_kg: Number,
        duration_seconds: Number,
        distance_meters: Number,
        rest_seconds: Number,
        completed: {
          type: Boolean,
          default: false,
        },
        form_rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        notes: String,
      },
    ],
    interval_structure: {
      work_seconds: {
        type: Number,
        min: 1,
      },
      rest_seconds: {
        type: Number,
        min: 0,
      },
      rounds: {
        type: Number,
        min: 1,
      },
      rounds_completed: {
        type: Number,
        min: 0,
      },
    },
    equipment_used: [String],
    target_muscles: {
      type: [String],
      required: true,
    },
    total_volume_kg: Number,
    total_duration_seconds: Number,
    personal_record: {
      type: Boolean,
      default: false,
    },
    difficulty_rating: {
      type: Number,
      min: 1,
      max: 10,
    },
    notes: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound indexes for efficient queries
exerciseLogSchema.index({ user_id: 1, exercise_name: 1, created_at: -1 });
exerciseLogSchema.index({ session_id: 1, created_at: 1 });
exerciseLogSchema.index({ user_id: 1, created_at: -1 });
exerciseLogSchema.index({ user_id: 1, personal_record: 1 });

// Calculate total volume and duration before saving
exerciseLogSchema.pre('save', function (next) {
  // Handle HIIT exercises with interval structure
  if (this.interval_structure && this.exercise_type === 'hiit') {
    const { work_seconds, rest_seconds, rounds_completed } = this.interval_structure;
    if (rounds_completed) {
      // Total duration = (work + rest) * completed rounds
      this.total_duration_seconds = (work_seconds + rest_seconds) * rounds_completed;
    }
  }

  // Handle traditional set-based exercises
  if (this.set_details && this.set_details.length > 0) {
    // Calculate total volume for strength exercises
    const volumeSets = this.set_details.filter(
      (set) => set.reps && set.weight_kg
    );
    if (volumeSets.length > 0) {
      this.total_volume_kg = volumeSets.reduce(
        (total, set) => total + (set.reps || 0) * (set.weight_kg || 0),
        0
      );
    }

    // Calculate total duration for cardio/time-based exercises
    const durationSets = this.set_details.filter((set) => set.duration_seconds);
    if (durationSets.length > 0) {
      this.total_duration_seconds = durationSets.reduce(
        (total, set) => total + (set.duration_seconds || 0),
        0
      );
    }
  }
  next();
});

export default mongoose.model<IExerciseLog>('ExerciseLog', exerciseLogSchema);
