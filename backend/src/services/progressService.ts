import WorkoutSession from '../models/WorkoutSession';
import ExerciseLog from '../models/ExerciseLog';
import mongoose from 'mongoose';

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
    max_weight_kg?: number;
    max_reps?: number;
    max_volume_kg?: number;
    achieved_date: Date;
  }>;
  exercise_history: Array<{
    exercise_name: string;
    total_sessions: number;
    average_weight_kg?: number;
    average_reps?: number;
    total_volume_kg?: number;
    last_performed: Date;
  }>;
}

export const calculateProgressStats = async (
  userId: string
): Promise<ProgressStats> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Overall stats
  const totalSessions = await WorkoutSession.countDocuments({
    user_id: userObjectId,
  });

  const completedSessions = await WorkoutSession.countDocuments({
    user_id: userObjectId,
    completion_status: 'completed',
  });

  const completionRate =
    totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  // Exercise stats
  const exerciseLogs = await ExerciseLog.find({ user_id: userObjectId });
  const totalExercises = exerciseLogs.length;
  const totalVolumeKg = exerciseLogs.reduce(
    (sum, log) => sum + (log.total_volume_kg || 0),
    0
  );

  // Total workout time
  const sessionsWithDuration = await WorkoutSession.find({
    user_id: userObjectId,
    actual_duration_minutes: { $exists: true, $gt: 0 },
  });
  const totalWorkoutTime = sessionsWithDuration.reduce(
    (sum, session) => sum + (session.actual_duration_minutes || 0),
    0
  );
  const averageSessionDuration =
    sessionsWithDuration.length > 0
      ? totalWorkoutTime / sessionsWithDuration.length
      : 0;

  // Calculate streaks
  const streaks = await calculateStreaks(userObjectId);

  // Recent performance (last 7 and 30 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const last7DaysSessions = await WorkoutSession.find({
    user_id: userObjectId,
    session_date: { $gte: sevenDaysAgo },
  });

  const last30DaysSessions = await WorkoutSession.find({
    user_id: userObjectId,
    session_date: { $gte: thirtyDaysAgo },
  });

  const calculatePeriodStats = (
    sessions: typeof last7DaysSessions
  ): { sessions: number; completion_rate: number; average_difficulty: number } => {
    const completed = sessions.filter((s) => s.completion_status === 'completed');
    const completionRate = sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0;
    const avgDifficulty =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.perceived_difficulty || 0), 0) /
          sessions.filter((s) => s.perceived_difficulty).length || 0
        : 0;
    return {
      sessions: sessions.length,
      completion_rate: Math.round(completionRate * 10) / 10,
      average_difficulty: Math.round(avgDifficulty * 10) / 10,
    };
  };

  // Personal records
  const personalRecords = await calculatePersonalRecords(userObjectId);

  // Exercise history
  const exerciseHistory = await calculateExerciseHistory(userObjectId);

  return {
    overall: {
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      completion_rate: Math.round(completionRate * 10) / 10,
      total_exercises: totalExercises,
      total_volume_kg: Math.round(totalVolumeKg * 10) / 10,
      total_workout_time_minutes: Math.round(totalWorkoutTime),
      current_streak_days: streaks.current,
      longest_streak_days: streaks.longest,
      average_session_duration: Math.round(averageSessionDuration),
    },
    recent_performance: {
      last_7_days: calculatePeriodStats(last7DaysSessions),
      last_30_days: calculatePeriodStats(last30DaysSessions),
    },
    personal_records: personalRecords,
    exercise_history: exerciseHistory,
  };
};

const calculateStreaks = async (
  userId: mongoose.Types.ObjectId
): Promise<{ current: number; longest: number }> => {
  const sessions = await WorkoutSession.find({
    user_id: userId,
    completion_status: 'completed',
  })
    .sort({ session_date: -1 })
    .select('session_date');

  if (sessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    const sessionDate = new Date(session.session_date);
    sessionDate.setHours(0, 0, 0, 0);

    if (!previousDate) {
      // First session
      const daysDiff = Math.floor(
        (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 1) {
        currentStreak = 1;
        tempStreak = 1;
      }
    } else {
      const daysDiff = Math.floor(
        (previousDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 1) {
        tempStreak++;
        if (currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else if (daysDiff > 1) {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    previousDate = sessionDate;
  }

  return { current: currentStreak, longest: longestStreak };
};

const calculatePersonalRecords = async (
  userId: mongoose.Types.ObjectId
): Promise<ProgressStats['personal_records']> => {
  const exercises = await ExerciseLog.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: '$exercise_name',
        max_weight_kg: { $max: '$set_details.weight_kg' },
        max_reps: { $max: '$set_details.reps' },
        max_volume_kg: { $max: '$total_volume_kg' },
        last_date: { $max: '$created_at' },
      },
    },
    { $sort: { max_volume_kg: -1 } },
    { $limit: 10 },
  ]);

  return exercises.map((ex) => ({
    exercise_name: ex._id,
    max_weight_kg: ex.max_weight_kg,
    max_reps: ex.max_reps,
    max_volume_kg: ex.max_volume_kg,
    achieved_date: ex.last_date,
  }));
};

const calculateExerciseHistory = async (
  userId: mongoose.Types.ObjectId
): Promise<ProgressStats['exercise_history']> => {
  const exercises = await ExerciseLog.aggregate([
    { $match: { user_id: userId } },
    { $unwind: { path: '$set_details', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$exercise_name',
        total_sessions: { $addToSet: '$session_id' },
        avg_weight: { $avg: '$set_details.weight_kg' },
        avg_reps: { $avg: '$set_details.reps' },
        total_volume: { $sum: '$total_volume_kg' },
        last_performed: { $max: '$created_at' },
      },
    },
    {
      $project: {
        exercise_name: '$_id',
        total_sessions: { $size: '$total_sessions' },
        average_weight_kg: { $round: ['$avg_weight', 1] },
        average_reps: { $round: ['$avg_reps', 0] },
        total_volume_kg: { $round: ['$total_volume', 1] },
        last_performed: 1,
      },
    },
    { $sort: { total_sessions: -1 } },
    { $limit: 20 },
  ]);

  return exercises.map((ex) => ({
    exercise_name: ex.exercise_name,
    total_sessions: ex.total_sessions,
    average_weight_kg: ex.average_weight_kg,
    average_reps: ex.average_reps,
    total_volume_kg: ex.total_volume_kg,
    last_performed: ex.last_performed,
  }));
};
