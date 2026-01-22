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
 * Medication Service
 *
 * Handles medication management, dose logging, and adherence tracking.
 * Phase 1: Manual entry + reminders
 * Phase 2: AI Vision bottle scanning (future)
 * Phase 3: Health correlations (future)
 */

import mongoose from 'mongoose';
import { Medication, IMedication } from '../models/Medication';
import { DoseLog, IDoseLog } from '../models/DoseLog';

// Types for service methods
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
  start_date?: Date;
  end_date?: Date;
}

export interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  is_active?: boolean;
}

export interface LogDoseInput {
  medication_id: string;
  scheduled_time: Date;
  status: 'taken' | 'skipped';
  taken_at?: Date;
  dosage_amount?: number;
  notes?: string;
  side_effects?: string[];
  mood_before?: 1 | 2 | 3 | 4 | 5;
  mood_after?: 1 | 2 | 3 | 4 | 5;
  energy_before?: 1 | 2 | 3 | 4 | 5;
  energy_after?: 1 | 2 | 3 | 4 | 5;
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

/**
 * Create a new medication for a user
 */
export async function createMedication(
  userId: string,
  input: CreateMedicationInput
): Promise<IMedication> {
  const medication = new Medication({
    user_id: new mongoose.Types.ObjectId(userId),
    ...input,
    inventory: {
      current_count: input.inventory?.current_count ?? 0,
      refill_threshold: input.inventory?.refill_threshold ?? 7,
    },
    is_active: true,
    manually_verified: true,
  });

  await medication.save();
  return medication;
}

/**
 * Get all medications for a user
 */
export async function getMedications(
  userId: string,
  activeOnly: boolean = true
): Promise<IMedication[]> {
  const query: Record<string, unknown> = {
    user_id: new mongoose.Types.ObjectId(userId)
  };

  if (activeOnly) {
    query.is_active = true;
  }

  return Medication.find(query).sort({ name: 1 });
}

/**
 * Get a single medication by ID
 */
export async function getMedicationById(
  userId: string,
  medicationId: string
): Promise<IMedication | null> {
  return Medication.findOne({
    _id: new mongoose.Types.ObjectId(medicationId),
    user_id: new mongoose.Types.ObjectId(userId),
  });
}

/**
 * Update a medication
 */
export async function updateMedication(
  userId: string,
  medicationId: string,
  input: UpdateMedicationInput
): Promise<IMedication | null> {
  return Medication.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(medicationId),
      user_id: new mongoose.Types.ObjectId(userId),
    },
    { $set: input },
    { new: true }
  );
}

/**
 * Delete (deactivate) a medication
 */
export async function deleteMedication(
  userId: string,
  medicationId: string
): Promise<boolean> {
  const result = await Medication.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(medicationId),
      user_id: new mongoose.Types.ObjectId(userId),
    },
    { $set: { is_active: false, end_date: new Date() } },
    { new: true }
  );

  return result !== null;
}

/**
 * Permanently delete a medication and all its dose logs
 */
export async function permanentlyDeleteMedication(
  userId: string,
  medicationId: string
): Promise<boolean> {
  const medId = new mongoose.Types.ObjectId(medicationId);
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Verify ownership
  const medication = await Medication.findOne({
    _id: medId,
    user_id: userObjId,
  });

  if (!medication) {
    return false;
  }

  // Delete all dose logs for this medication
  await DoseLog.deleteMany({ medication_id: medId });

  // Delete the medication
  await Medication.deleteOne({ _id: medId });

  return true;
}

/**
 * Log a dose (taken or skipped)
 */
export async function logDose(
  userId: string,
  input: LogDoseInput
): Promise<IDoseLog> {
  const medication = await getMedicationById(userId, input.medication_id);

  if (!medication) {
    throw new Error('Medication not found');
  }

  // Check if log already exists for this scheduled time
  const existing = await DoseLog.findOne({
    medication_id: new mongoose.Types.ObjectId(input.medication_id),
    scheduled_time: input.scheduled_time,
  });

  if (existing) {
    // Update existing log
    existing.status = input.status;
    existing.taken_at = input.status === 'taken' ? (input.taken_at || new Date()) : undefined;
    existing.dosage_amount = input.dosage_amount;
    existing.notes = input.notes;
    existing.side_effects = input.side_effects;
    existing.mood_before = input.mood_before;
    existing.mood_after = input.mood_after;
    existing.energy_before = input.energy_before;
    existing.energy_after = input.energy_after;

    await existing.save();
    return existing;
  }

  // Create new log
  const doseLog = new DoseLog({
    user_id: new mongoose.Types.ObjectId(userId),
    medication_id: new mongoose.Types.ObjectId(input.medication_id),
    scheduled_time: input.scheduled_time,
    taken_at: input.status === 'taken' ? (input.taken_at || new Date()) : undefined,
    status: input.status,
    dosage_amount: input.dosage_amount,
    notes: input.notes,
    side_effects: input.side_effects,
    mood_before: input.mood_before,
    mood_after: input.mood_after,
    energy_before: input.energy_before,
    energy_after: input.energy_after,
  });

  await doseLog.save();

  // Update inventory count if taken
  if (input.status === 'taken' && medication.inventory.current_count > 0) {
    await Medication.updateOne(
      { _id: medication._id },
      { $inc: { 'inventory.current_count': -1 } }
    );
  }

  return doseLog;
}

/**
 * Get dose logs for a medication
 */
export async function getDoseLogs(
  userId: string,
  medicationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<IDoseLog[]> {
  const query: Record<string, unknown> = {
    user_id: new mongoose.Types.ObjectId(userId),
    medication_id: new mongoose.Types.ObjectId(medicationId),
  };

  if (startDate || endDate) {
    query.scheduled_time = {};
    if (startDate) {
      (query.scheduled_time as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (query.scheduled_time as Record<string, Date>).$lte = endDate;
    }
  }

  return DoseLog.find(query).sort({ scheduled_time: -1 });
}

/**
 * Get today's doses for all medications
 */
export async function getTodaysDoses(userId: string): Promise<{
  medication: IMedication;
  doses: Array<{
    scheduled_time: Date;
    status: 'pending' | 'taken' | 'skipped' | 'missed';
    log?: IDoseLog;
  }>;
}[]> {
  const medications = await getMedications(userId, true);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = [];

  for (const medication of medications) {
    // Check if this medication is scheduled for today
    const dayOfWeek = today.getDay();
    const daysOfWeek = medication.frequency.days_of_week || [0, 1, 2, 3, 4, 5, 6];

    if (!daysOfWeek.includes(dayOfWeek)) {
      continue;
    }

    // Get specific times or generate default times
    const times = medication.frequency.specific_times?.length
      ? medication.frequency.specific_times
      : generateDefaultTimes(medication.frequency.times_per_day);

    // Get existing logs for today
    const existingLogs = await DoseLog.find({
      medication_id: medication._id,
      scheduled_time: { $gte: today, $lt: tomorrow },
    });

    const doses = times.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const existingLog = existingLogs.find(
        log => log.scheduled_time.getTime() === scheduledTime.getTime()
      );

      // Determine status
      let status: 'pending' | 'taken' | 'skipped' | 'missed' = 'pending';
      if (existingLog) {
        status = existingLog.status;
      } else if (scheduledTime < new Date()) {
        // Past scheduled time with no log = missed
        status = 'missed';
      }

      return {
        scheduled_time: scheduledTime,
        status,
        log: existingLog,
      };
    });

    result.push({ medication, doses });
  }

  return result;
}

/**
 * Calculate adherence statistics for a medication
 */
export async function getAdherenceStats(
  userId: string,
  medicationId: string,
  days: number = 30
): Promise<AdherenceStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const logs = await getDoseLogs(userId, medicationId, startDate);

  const total_taken = logs.filter(l => l.status === 'taken').length;
  const total_skipped = logs.filter(l => l.status === 'skipped').length;
  const total_missed = logs.filter(l => l.status === 'missed').length;
  const total_scheduled = logs.length;

  const adherence_rate = total_scheduled > 0
    ? Math.round((total_taken / total_scheduled) * 100)
    : 100;

  // Calculate streaks
  const sortedLogs = [...logs].sort(
    (a, b) => a.scheduled_time.getTime() - b.scheduled_time.getTime()
  );

  let current_streak = 0;
  let longest_streak = 0;
  let tempStreak = 0;

  for (const log of sortedLogs) {
    if (log.status === 'taken') {
      tempStreak++;
      longest_streak = Math.max(longest_streak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak from most recent
  const reversedLogs = [...sortedLogs].reverse();
  for (const log of reversedLogs) {
    if (log.status === 'taken') {
      current_streak++;
    } else {
      break;
    }
  }

  return {
    total_scheduled,
    total_taken,
    total_skipped,
    total_missed,
    adherence_rate,
    current_streak,
    longest_streak,
  };
}

/**
 * Get medications that need refill
 */
export async function getMedicationsNeedingRefill(
  userId: string
): Promise<IMedication[]> {
  return Medication.find({
    user_id: new mongoose.Types.ObjectId(userId),
    is_active: true,
    $expr: {
      $lte: ['$inventory.current_count', '$inventory.refill_threshold'],
    },
  });
}

/**
 * Refill medication inventory
 */
export async function refillMedication(
  userId: string,
  medicationId: string,
  count: number
): Promise<IMedication | null> {
  return Medication.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(medicationId),
      user_id: new mongoose.Types.ObjectId(userId),
    },
    {
      $inc: { 'inventory.current_count': count },
      $set: { 'inventory.last_refill_date': new Date() },
    },
    { new: true }
  );
}

/**
 * Generate default times based on times_per_day
 */
function generateDefaultTimes(timesPerDay: number): string[] {
  const times: string[] = [];

  switch (timesPerDay) {
    case 1:
      times.push('08:00');
      break;
    case 2:
      times.push('08:00', '20:00');
      break;
    case 3:
      times.push('08:00', '14:00', '20:00');
      break;
    case 4:
      times.push('08:00', '12:00', '16:00', '20:00');
      break;
    default:
      // Distribute evenly throughout waking hours (7am - 10pm)
      const startHour = 7;
      const endHour = 22;
      const interval = (endHour - startHour) / timesPerDay;
      for (let i = 0; i < timesPerDay; i++) {
        const hour = Math.round(startHour + (interval * i));
        times.push(`${hour.toString().padStart(2, '0')}:00`);
      }
  }

  return times;
}
