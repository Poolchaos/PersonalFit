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

import type {
  LLMConfig,
  LLMResponse,
  RateLimitInfo,
  LLMProvider as LLMProviderType,
} from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseLLMProvider {
  protected config: LLMConfig;
  protected rateLimitInfo: RateLimitInfo;

  constructor(config: LLMConfig) {
    this.config = config;
    this.rateLimitInfo = {
      provider: config.provider,
    };
  }

  abstract get providerName(): LLMProviderType;
  abstract get defaultModel(): string;
  abstract get costPer1KInputTokens(): number;
  abstract get costPer1KOutputTokens(): number;

  /**
   * Generate completion from chat messages
   */
  abstract generateCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResponse<string>>;

  /**
   * Generate structured JSON output
   */
  abstract generateStructuredOutput<T>(
    messages: ChatMessage[],
    schema: object,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResponse<T>>;

  /**
   * Check rate limit status
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Calculate estimated cost for token usage
   */
  protected calculateCost(promptTokens: number, completionTokens: number): number {
    const inputCost = (promptTokens / 1000) * this.costPer1KInputTokens;
    const outputCost = (completionTokens / 1000) * this.costPer1KOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Validate API key format (basic check)
   */
  protected validateApiKey(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  /**
   * Test if the provider is properly configured and accessible
   */
  abstract testConnection(): Promise<boolean>;
}
