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

/**
 * Adherence Service
 *
 * Provides comprehensive medication adherence tracking and analytics
 * Uses DoseLog model for dose tracking data
 */

import { Medication, IMedication } from '../models/Medication';
import { DoseLog, IDoseLog } from '../models/DoseLog';
import mongoose from 'mongoose';

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

export interface DayPatternInsight {
  pattern: 'weekday' | 'weekend';
  adherencePercentage: number;
  missedCount: number;
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

/**
 * Get adherence overview for a user
 */
export async function getAdherenceOverview(
  userId: string,
  days: number = 30
): Promise<AdherenceOverview> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get user's medications
  const medications = await Medication.find({
    user_id: userObjectId,
    is_active: true,
  });

  // Get dose logs for the period
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const doseLogs = await DoseLog.find({
    user_id: userObjectId,
    scheduled_time: { $gte: startDate },
  });

  // Calculate weekly adherence (last 7 days)
  const weeklyAdherence = calculateDailyAdherence(doseLogs, 7);

  // Calculate monthly adherence (last 30 days)
  const monthlyAdherence = calculateDailyAdherence(doseLogs, Math.min(days, 30));

  // Calculate per-medication adherence
  const medicationAdherence = calculateMedicationAdherence(medications, doseLogs);

  // Calculate streak
  const streak = await calculateStreak(userObjectId, doseLogs);

  // Calculate overall stats
  const overallStats = await calculateOverallStats(userObjectId, doseLogs);

  // Generate insights
  const insights = generateInsights(
    medications,
    doseLogs,
    weeklyAdherence,
    medicationAdherence,
    streak
  );

  return {
    weeklyAdherence,
    monthlyAdherence,
    medicationAdherence,
    streak,
    overallStats,
    insights,
  };
}

/**
 * Calculate daily adherence for a given number of days
 */
function calculateDailyAdherence(
  doseLogs: IDoseLog[],
  days: number
): DailyAdherence[] {
  const result: DailyAdherence[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];

    // Filter dose logs for this day
    const dayLogs = doseLogs.filter((log) => {
      const logDate = new Date(log.scheduled_time);
      return logDate >= date && logDate < nextDate;
    });

    const taken = dayLogs.filter((log) => log.status === 'taken').length;
    const missed = dayLogs.filter((log) => log.status === 'missed').length;
    const skipped = dayLogs.filter((log) => log.status === 'skipped').length;
    const total = dayLogs.length;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    result.push({
      date: dateStr,
      taken,
      missed,
      skipped,
      total,
      percentage,
    });
  }

  return result;
}

/**
 * Calculate per-medication adherence
 */
function calculateMedicationAdherence(
  medications: IMedication[],
  doseLogs: IDoseLog[]
): MedicationAdherence[] {
  const result: MedicationAdherence[] = [];

  for (const med of medications) {
    const medId = (med._id as mongoose.Types.ObjectId).toString();
    const medLogs = doseLogs.filter(
      (log) => log.medication_id.toString() === medId
    );

    const taken = medLogs.filter((log) => log.status === 'taken').length;
    const missed = medLogs.filter((log) => log.status === 'missed').length;
    const skipped = medLogs.filter((log) => log.status === 'skipped').length;
    const total = medLogs.length;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    result.push({
      medicationId: medId,
      medicationName: med.name,
      taken,
      missed,
      skipped,
      total,
      percentage,
    });
  }

  // Sort by percentage (lowest first to highlight problem areas)
  return result.sort((a, b) => a.percentage - b.percentage);
}

/**
 * Calculate streak information
 */
async function calculateStreak(
  _userId: mongoose.Types.ObjectId,
  doseLogs: IDoseLog[]
): Promise<AdherenceStreak> {
  // Perfect day = 80% or more adherence
  const PERFECT_THRESHOLD = 0.8;

  // Get daily adherence for streak calculation (up to 90 days)
  const dailyAdherence = calculateDailyAdherence(doseLogs, 90);

  let currentStreak = 0;
  let longestStreak = 0;
  let lastPerfectDay: string | null = null;

  // Calculate current streak - start from today (end of array) and go backwards
  let countingCurrent = true;
  for (let i = dailyAdherence.length - 1; i >= 0; i--) {
    const day = dailyAdherence[i];
    const isPerfect = day.total > 0 && day.percentage >= PERFECT_THRESHOLD * 100;

    if (countingCurrent) {
      if (isPerfect) {
        currentStreak++;
        if (lastPerfectDay === null) {
          lastPerfectDay = day.date;
        }
      } else if (day.total > 0) {
        // Day with doses but not perfect - streak ends
        countingCurrent = false;
      }
      // If day.total === 0, skip it (no doses scheduled, doesn't break streak)
    }
  }

  // Calculate longest streak - scan through all days
  let tempStreak = 0;
  for (let i = 0; i < dailyAdherence.length; i++) {
    const day = dailyAdherence[i];
    const isPerfect = day.total > 0 && day.percentage >= PERFECT_THRESHOLD * 100;

    if (isPerfect) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (day.total > 0) {
      // Day with doses but not perfect - reset temp streak
      tempStreak = 0;
    }
    // If day.total === 0, continue the streak (no doses scheduled)
  }

  // Ensure longest is at least as much as current
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    current: currentStreak,
    longest: longestStreak,
    lastPerfectDay,
  };
}

/**
 * Calculate overall stats (this week, this month, all time)
 */
async function calculateOverallStats(
  userId: mongoose.Types.ObjectId,
  recentLogs: IDoseLog[]
): Promise<{
  thisWeek: { taken: number; total: number; percentage: number };
  thisMonth: { taken: number; total: number; percentage: number };
  allTime: { taken: number; total: number; percentage: number };
}> {
  const now = new Date();

  // This week
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekLogs = recentLogs.filter((log) => new Date(log.scheduled_time) >= weekStart);
  const weekTaken = weekLogs.filter((log) => log.status === 'taken').length;
  const weekTotal = weekLogs.length;

  // This month
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);
  const monthLogs = recentLogs.filter((log) => new Date(log.scheduled_time) >= monthStart);
  const monthTaken = monthLogs.filter((log) => log.status === 'taken').length;
  const monthTotal = monthLogs.length;

  // All time - get from database
  const allTimeLogs = await DoseLog.find({ user_id: userId });
  const allTimeTaken = allTimeLogs.filter((log) => log.status === 'taken').length;
  const allTimeTotal = allTimeLogs.length;

  return {
    thisWeek: {
      taken: weekTaken,
      total: weekTotal,
      percentage: weekTotal > 0 ? Math.round((weekTaken / weekTotal) * 100) : 0,
    },
    thisMonth: {
      taken: monthTaken,
      total: monthTotal,
      percentage: monthTotal > 0 ? Math.round((monthTaken / monthTotal) * 100) : 0,
    },
    allTime: {
      taken: allTimeTaken,
      total: allTimeTotal,
      percentage: allTimeTotal > 0 ? Math.round((allTimeTaken / allTimeTotal) * 100) : 0,
    },
  };
}

/**
 * Analyze time patterns for missed doses
 */
function analyzeTimePatterns(doseLogs: IDoseLog[]): TimePatternInsight[] {
  const patterns: { [key: string]: { missed: number; total: number } } = {
    morning: { missed: 0, total: 0 },    // 6 AM - 12 PM
    afternoon: { missed: 0, total: 0 },  // 12 PM - 6 PM
    evening: { missed: 0, total: 0 },    // 6 PM - 10 PM
    night: { missed: 0, total: 0 },      // 10 PM - 6 AM
  };

  for (const log of doseLogs) {
    const hour = new Date(log.scheduled_time).getHours();
    let period: string;

    if (hour >= 6 && hour < 12) {
      period = 'morning';
    } else if (hour >= 12 && hour < 18) {
      period = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      period = 'evening';
    } else {
      period = 'night';
    }

    patterns[period].total++;
    if (log.status === 'missed') {
      patterns[period].missed++;
    }
  }

  return Object.entries(patterns)
    .filter(([, data]) => data.total > 0)
    .map(([pattern, data]) => ({
      pattern: pattern as 'morning' | 'afternoon' | 'evening' | 'night',
      missedCount: data.missed,
      totalCount: data.total,
      missedPercentage: Math.round((data.missed / data.total) * 100),
    }))
    .sort((a, b) => b.missedPercentage - a.missedPercentage);
}

/**
 * Analyze day patterns (weekday vs weekend)
 */
function analyzeDayPatterns(weeklyAdherence: DailyAdherence[]): DayPatternInsight[] {
  let weekdayTaken = 0;
  let weekdayTotal = 0;
  let weekdayMissed = 0;
  let weekendTaken = 0;
  let weekendTotal = 0;
  let weekendMissed = 0;

  for (const day of weeklyAdherence) {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTaken += day.taken;
      weekendTotal += day.total;
      weekendMissed += day.missed;
    } else {
      weekdayTaken += day.taken;
      weekdayTotal += day.total;
      weekdayMissed += day.missed;
    }
  }

  return [
    {
      pattern: 'weekday' as const,
      adherencePercentage: weekdayTotal > 0 ? Math.round((weekdayTaken / weekdayTotal) * 100) : 0,
      missedCount: weekdayMissed,
    },
    {
      pattern: 'weekend' as const,
      adherencePercentage: weekendTotal > 0 ? Math.round((weekendTaken / weekendTotal) * 100) : 0,
      missedCount: weekendMissed,
    },
  ];
}

/**
 * Generate actionable insights based on adherence data
 */
function generateInsights(
  medications: IMedication[],
  doseLogs: IDoseLog[],
  weeklyAdherence: DailyAdherence[],
  medicationAdherence: MedicationAdherence[],
  streak: AdherenceStreak
): AdherenceInsight[] {
  const insights: AdherenceInsight[] = [];

  // Streak insight
  if (streak.current >= 7) {
    insights.push({
      type: 'streak',
      severity: 'success',
      title: '🔥 Great Streak!',
      message: `You've had ${streak.current} perfect days in a row!`,
      suggestion: 'Keep it up! Consistency is key to getting the most from your medications.',
    });
  } else if (streak.current === 0 && streak.longest > 0) {
    insights.push({
      type: 'streak',
      severity: 'info',
      title: 'Restart Your Streak',
      message: `Your longest streak was ${streak.longest} days. Let's get back on track!`,
      suggestion: 'Start fresh today - every perfect day counts!',
    });
  }

  // Time pattern insights
  const timePatterns = analyzeTimePatterns(doseLogs);
  const worstTimePattern = timePatterns.find((p) => p.missedPercentage > 30);
  if (worstTimePattern && worstTimePattern.totalCount >= 5) {
    const timeLabels: Record<string, string> = {
      morning: 'morning (6 AM - 12 PM)',
      afternoon: 'afternoon (12 PM - 6 PM)',
      evening: 'evening (6 PM - 10 PM)',
      night: 'night (10 PM - 6 AM)',
    };

    insights.push({
      type: 'time_pattern',
      severity: 'warning',
      title: `${worstTimePattern.pattern.charAt(0).toUpperCase() + worstTimePattern.pattern.slice(1)} Doses Need Attention`,
      message: `You miss ${worstTimePattern.missedPercentage}% of your ${timeLabels[worstTimePattern.pattern]} medications.`,
      suggestion: 'Consider setting reminders or adjusting the time with your doctor.',
      actionType: 'set_reminder',
      actionData: { pattern: worstTimePattern.pattern },
    });
  }

  // Day pattern insights
  const dayPatterns = analyzeDayPatterns(weeklyAdherence);
  const weekendPattern = dayPatterns.find((p) => p.pattern === 'weekend');
  const weekdayPattern = dayPatterns.find((p) => p.pattern === 'weekday');

  if (
    weekendPattern &&
    weekdayPattern &&
    weekdayPattern.adherencePercentage - weekendPattern.adherencePercentage > 15
  ) {
    insights.push({
      type: 'day_pattern',
      severity: 'warning',
      title: 'Weekend Reminder',
      message: `Your weekend adherence (${weekendPattern.adherencePercentage}%) is lower than weekdays (${weekdayPattern.adherencePercentage}%).`,
      suggestion: 'Set up weekend-specific reminders to stay on track.',
      actionType: 'set_reminder',
    });
  }

  // Medication-specific insights
  for (const med of medicationAdherence) {
    if (med.total >= 5 && med.percentage < 70) {
      const medication = medications.find(
        (m) => (m._id as mongoose.Types.ObjectId).toString() === med.medicationId
      );

      insights.push({
        type: 'medication_specific',
        severity: 'warning',
        title: `${med.medicationName} Needs Attention`,
        message: `You've only taken ${med.percentage}% of your ${med.medicationName} doses.`,
        suggestion: medication?.frequency?.notes || 'Consider setting a reminder for this medication.',
        actionType: 'view_medication',
        actionData: { medicationId: med.medicationId },
      });
    }
  }

  // Weekly trend insight
  if (weeklyAdherence.length >= 7) {
    const firstHalf = weeklyAdherence.slice(0, 3);
    const secondHalf = weeklyAdherence.slice(4);

    const firstHalfAvg =
      firstHalf.reduce((sum, d) => sum + d.percentage, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, d) => sum + d.percentage, 0) / secondHalf.length;

    if (secondHalfAvg - firstHalfAvg > 10) {
      insights.push({
        type: 'improvement',
        severity: 'success',
        title: '📈 Improving!',
        message: `Your adherence has improved by ${Math.round(secondHalfAvg - firstHalfAvg)}% this week!`,
        suggestion: 'Great progress! Keep up the good work.',
      });
    } else if (firstHalfAvg - secondHalfAvg > 10) {
      insights.push({
        type: 'declining',
        severity: 'warning',
        title: 'Adherence Declining',
        message: `Your adherence has dropped by ${Math.round(firstHalfAvg - secondHalfAvg)}% recently.`,
        suggestion: 'Try to identify what changed and get back on track.',
      });
    }
  }

  // Limit to top 5 most relevant insights
  return insights.slice(0, 5);
}

/**
 * Get detailed adherence stats for a single medication
 */
export async function getMedicationAdherence(
  userId: string,
  medicationId: string,
  days: number = 30
): Promise<{
  medication: IMedication | null;
  dailyAdherence: DailyAdherence[];
  stats: MedicationAdherence | null;
  timePatterns: TimePatternInsight[];
}> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const medObjectId = new mongoose.Types.ObjectId(medicationId);

  const medication = await Medication.findOne({
    _id: medObjectId,
    user_id: userObjectId,
  });

  if (!medication) {
    return {
      medication: null,
      dailyAdherence: [],
      stats: null,
      timePatterns: [],
    };
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const doseLogs = await DoseLog.find({
    user_id: userObjectId,
    medication_id: medObjectId,
    scheduled_time: { $gte: startDate },
  });

  const dailyAdherence = calculateDailyAdherence(doseLogs, days);

  const taken = doseLogs.filter((log) => log.status === 'taken').length;
  const missed = doseLogs.filter((log) => log.status === 'missed').length;
  const skipped = doseLogs.filter((log) => log.status === 'skipped').length;
  const total = doseLogs.length;

  const stats: MedicationAdherence = {
    medicationId: (medication._id as mongoose.Types.ObjectId).toString(),
    medicationName: medication.name,
    taken,
    missed,
    skipped,
    total,
    percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
  };

  const timePatterns = analyzeTimePatterns(doseLogs);

  return {
    medication,
    dailyAdherence,
    stats,
    timePatterns,
  };
}
