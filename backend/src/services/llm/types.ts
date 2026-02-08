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

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'moonshot';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD
}

export interface LLMResponse<T = unknown> {
  content: T;
  usage: LLMUsage;
  provider: LLMProvider;
  model: string;
  timestamp: Date;
}

export interface RateLimitInfo {
  provider: LLMProvider;
  requestsRemaining?: number;
  tokensRemaining?: number;
  resetTime?: Date;
  dailyLimit?: number;
  dailyUsed?: number;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: LLMProvider,
    public statusCode?: number,
    public rateLimitInfo?: RateLimitInfo
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(
    message: string,
    provider: LLMProvider,
    rateLimitInfo: RateLimitInfo
  ) {
    super(message, provider, 429, rateLimitInfo);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends LLMError {
  constructor(message: string, provider: LLMProvider) {
    super(message, provider, 401);
    this.name = 'AuthenticationError';
  }
}

export class InvalidRequestError extends LLMError {
  constructor(message: string, provider: LLMProvider) {
    super(message, provider, 400);
    this.name = 'InvalidRequestError';
  }
}
