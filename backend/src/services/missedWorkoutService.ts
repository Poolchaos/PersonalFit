import mongoose from 'mongoose';
import WorkoutSession from '../models/WorkoutSession';
import WorkoutPlan from '../models/WorkoutPlan';
import { assignPenalty, resetStreak } from './accountabilityService';

interface MissedWorkout {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  workoutDate: Date;
  hoursOverdue: number;
  difficulty?: string;
}

/**
 * Calculate penalty severity based on workout difficulty and hours overdue
 */
const calculatePenaltySeverity = (
  difficulty: string | undefined,
  hoursOverdue: number
): 'light' | 'moderate' | 'severe' => {
  // Base severity on hours overdue
  let severityScore = 0;

  if (hoursOverdue >= 72) {
    severityScore = 3; // 3+ days
  } else if (hoursOverdue >= 48) {
    severityScore = 2; // 2+ days
  } else {
    severityScore = 1; // 1+ day
  }

  // Adjust based on difficulty
  if (difficulty === 'advanced' || difficulty === 'hard') {
    severityScore = Math.min(3, severityScore + 1);
  } else if (difficulty === 'beginner' || difficulty === 'easy') {
    severityScore = Math.max(1, severityScore - 1);
  }

  // Map score to severity
  if (severityScore >= 3) return 'severe';
  if (severityScore >= 2) return 'moderate';
  return 'light';
};

/**
 * Find all missed workouts (sessions that are overdue)
 */
export const findMissedWorkouts = async (): Promise<MissedWorkout[]> => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find all sessions that are:
  // 1. Planned or in-progress status
  // 2. Session date was more than 24 hours ago
  const overdueSessions = await WorkoutSession.find({
    completion_status: { $in: ['planned', 'in_progress'] },
    session_date: { $lt: oneDayAgo },
  }).lean();

  const missedWorkouts: MissedWorkout[] = [];

  for (const session of overdueSessions) {
    const hoursOverdue = Math.floor(
      (now.getTime() - session.session_date.getTime()) / (1000 * 60 * 60)
    );

    // Get workout plan for difficulty level
    let difficulty: string | undefined;
    if (session.plan_id) {
      const plan = await WorkoutPlan.findById(session.plan_id)
        .select('generation_context')
        .lean();
      difficulty = plan?.generation_context?.experience_level;
    }

    missedWorkouts.push({
      userId: session.user_id,
      sessionId: session._id as mongoose.Types.ObjectId,
      workoutDate: session.session_date,
      hoursOverdue,
      difficulty,
    });
  }

  return missedWorkouts;
};

/**
 * Process missed workouts and assign penalties
 */
export const processMissedWorkouts = async (): Promise<{
  processed: number;
  penaltiesAssigned: number;
  streaksReset: number;
}> => {
  const missedWorkouts = await findMissedWorkouts();
  let penaltiesAssigned = 0;
  let streaksReset = 0;

  for (const missed of missedWorkouts) {
    try {
      // Mark session as skipped
      await WorkoutSession.findByIdAndUpdate(missed.sessionId, {
        completion_status: 'skipped',
        notes: `Automatically marked as skipped - ${missed.hoursOverdue}h overdue`,
      });

      // Calculate severity
      const severity = calculatePenaltySeverity(
        missed.difficulty,
        missed.hoursOverdue
      );

      // Assign penalty
      await assignPenalty(
        missed.userId,
        missed.workoutDate,
        severity,
        `Missed workout (${missed.hoursOverdue}h overdue)`
      );
      penaltiesAssigned++;

      // Reset streak
      await resetStreak(missed.userId);
      streaksReset++;
    } catch (error) {
      console.error(
        `Error processing missed workout for user ${missed.userId}:`,
        error
      );
      // Continue processing other missed workouts
    }
  }

  return {
    processed: missedWorkouts.length,
    penaltiesAssigned,
    streaksReset,
  };
};

/**
 * Manual trigger for testing/admin use
 */
export const triggerMissedWorkoutDetection = async (): Promise<{
  success: boolean;
  result?: {
    processed: number;
    penaltiesAssigned: number;
    streaksReset: number;
  };
  error?: string;
}> => {
  try {
    const result = await processMissedWorkouts();
    return { success: true, result };
  } catch (error) {
    console.error('Failed to process missed workouts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
