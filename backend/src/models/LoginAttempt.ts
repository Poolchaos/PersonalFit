/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ip_address: string;
  success: boolean;
  timestamp: Date;
}

const LoginAttemptSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ip_address: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying failed attempts by email within time window
LoginAttemptSchema.index({ email: 1, timestamp: 1, success: 1 });

// TTL index to auto-delete old attempts after 24 hours (cleanup)
LoginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

// Static method to count recent failed attempts for an email
LoginAttemptSchema.statics.countRecentFailedAttempts = async function (
  email: string,
  windowMinutes: number = 15
): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  return this.countDocuments({
    email: email.toLowerCase(),
    success: false,
    timestamp: { $gte: windowStart },
  });
};

// Static method to record a login attempt
LoginAttemptSchema.statics.recordAttempt = async function (
  email: string,
  ipAddress: string,
  success: boolean
): Promise<ILoginAttempt> {
  return this.create({
    email: email.toLowerCase(),
    ip_address: ipAddress,
    success,
    timestamp: new Date(),
  });
};

// Static method to clear failed attempts on successful login (optional)
LoginAttemptSchema.statics.clearFailedAttempts = async function (
  email: string
): Promise<number> {
  const result = await this.deleteMany({
    email: email.toLowerCase(),
    success: false,
  });
  return result.deletedCount;
};

// Extend the model interface with static methods
export interface ILoginAttemptModel extends mongoose.Model<ILoginAttempt> {
  countRecentFailedAttempts(email: string, windowMinutes?: number): Promise<number>;
  recordAttempt(email: string, ipAddress: string, success: boolean): Promise<ILoginAttempt>;
  clearFailedAttempts(email: string): Promise<number>;
}

export default mongoose.model<ILoginAttempt, ILoginAttemptModel>(
  'LoginAttempt',
  LoginAttemptSchema
);
