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

import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IRefreshToken extends Document {
  token_hash: string;
  user_id: Types.ObjectId;
  expires_at: Date;
  revoked_at?: Date;
  replaced_by?: Types.ObjectId; // Reference to the new token if rotated
  created_at: Date;
  device_info?: string; // Optional: user agent or device identifier
  isRevoked(): boolean;
  isExpired(): boolean;
}

const RefreshTokenSchema: Schema = new Schema(
  {
    token_hash: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
    replaced_by: {
      type: Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null,
    },
    device_info: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Compound index for efficient token lookup and cleanup
RefreshTokenSchema.index({ user_id: 1, revoked_at: 1 });

// TTL index to auto-delete expired tokens after 30 days
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Instance methods
RefreshTokenSchema.methods.isRevoked = function (): boolean {
  return this.revoked_at !== null;
};

RefreshTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expires_at;
};

// Static method to hash a token
RefreshTokenSchema.statics.hashToken = function (token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to find a valid (non-revoked, non-expired) token
RefreshTokenSchema.statics.findValidToken = async function (
  tokenHash: string
): Promise<IRefreshToken | null> {
  return this.findOne({
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: { $gt: new Date() },
  });
};

// Static method to revoke all tokens for a user (logout all devices)
RefreshTokenSchema.statics.revokeAllUserTokens = async function (
  userId: Types.ObjectId | string
): Promise<number> {
  const result = await this.updateMany(
    { user_id: userId, revoked_at: null },
    { revoked_at: new Date() }
  );
  return result.modifiedCount;
};

// Static method to revoke a single token
RefreshTokenSchema.statics.revokeToken = async function (
  tokenHash: string,
  replacedBy?: Types.ObjectId
): Promise<IRefreshToken | null> {
  return this.findOneAndUpdate(
    { token_hash: tokenHash, revoked_at: null },
    { revoked_at: new Date(), replaced_by: replacedBy || null },
    { new: true }
  );
};

// Extend the model interface with static methods
export interface IRefreshTokenModel extends mongoose.Model<IRefreshToken> {
  hashToken(token: string): string;
  findValidToken(tokenHash: string): Promise<IRefreshToken | null>;
  revokeAllUserTokens(userId: Types.ObjectId | string): Promise<number>;
  revokeToken(tokenHash: string, replacedBy?: Types.ObjectId): Promise<IRefreshToken | null>;
}

export default mongoose.model<IRefreshToken, IRefreshTokenModel>(
  'RefreshToken',
  RefreshTokenSchema
);
