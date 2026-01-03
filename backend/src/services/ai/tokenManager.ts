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
 * Token Manager - Pre-flight token estimation and budget management
 * Provides token counting using tiktoken for accurate cost estimation
 */

import { Tiktoken, TiktokenModel, encoding_for_model } from 'tiktoken';

export interface TokenEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  modelContextLimit: number;
  withinBudget: boolean;
}

export interface TokenBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens: number;
  maxCostUSD: number;
}

// Model context limits and pricing (per 1K tokens)
const MODEL_CONFIG: Record<string, { contextLimit: number; inputPrice: number; outputPrice: number }> = {
  'gpt-4o': { contextLimit: 128000, inputPrice: 0.0025, outputPrice: 0.01 },
  'gpt-4o-mini': { contextLimit: 128000, inputPrice: 0.00015, outputPrice: 0.0006 },
  'gpt-4-turbo': { contextLimit: 128000, inputPrice: 0.01, outputPrice: 0.03 },
  'gpt-4': { contextLimit: 8192, inputPrice: 0.03, outputPrice: 0.06 },
  'gpt-3.5-turbo': { contextLimit: 16385, inputPrice: 0.0005, outputPrice: 0.0015 },
  'claude-3-5-sonnet-20241022': { contextLimit: 200000, inputPrice: 0.003, outputPrice: 0.015 },
  'claude-3-opus-20240229': { contextLimit: 200000, inputPrice: 0.015, outputPrice: 0.075 },
  'claude-3-haiku-20240307': { contextLimit: 200000, inputPrice: 0.00025, outputPrice: 0.00125 },
};

// Default budget for workout generation
export const DEFAULT_WORKOUT_BUDGET: TokenBudget = {
  maxInputTokens: 8000,
  maxOutputTokens: 4000,
  maxTotalTokens: 12000,
  maxCostUSD: 0.10,
};

export class TokenManager {
  private encoder: Tiktoken | null = null;
  private model: string;

  constructor(model: string = 'gpt-4o-mini') {
    this.model = model;
    this.initializeEncoder();
  }

  private initializeEncoder(): void {
    try {
      // Map model names to tiktoken models
      const tiktokenModel = this.getTiktokenModel(this.model);
      this.encoder = encoding_for_model(tiktokenModel);
    } catch {
      // Fallback to cl100k_base encoding (used by GPT-4 and GPT-3.5-turbo)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { get_encoding } = require('tiktoken');
      this.encoder = get_encoding('cl100k_base');
    }
  }

  private getTiktokenModel(model: string): TiktokenModel {
    // Map our model names to tiktoken-compatible names
    if (model.includes('gpt-4o')) return 'gpt-4o';
    if (model.includes('gpt-4')) return 'gpt-4';
    if (model.includes('gpt-3.5')) return 'gpt-3.5-turbo';
    // Default to gpt-4o for unknown models
    return 'gpt-4o';
  }

  /**
   * Count tokens in a string
   */
  countTokens(text: string): number {
    if (!this.encoder) {
      // Fallback: rough estimate of ~4 chars per token
      return Math.ceil(text.length / 4);
    }
    return this.encoder.encode(text).length;
  }

  /**
   * Count tokens in a chat message array
   */
  countMessageTokens(messages: Array<{ role: string; content: string }>): number {
    let totalTokens = 0;

    for (const message of messages) {
      // Each message has overhead: <|start|>role<|end|>content<|end|>
      totalTokens += 4; // Message overhead
      totalTokens += this.countTokens(message.role);
      totalTokens += this.countTokens(message.content);
    }

    // Reply priming overhead
    totalTokens += 3;

    return totalTokens;
  }

  /**
   * Estimate total tokens and cost for a request
   */
  estimateRequest(
    systemPrompt: string,
    userPrompt: string,
    estimatedOutputRatio: number = 0.5
  ): TokenEstimate {
    const inputTokens = this.countMessageTokens([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Estimate output tokens based on input (workout plans are typically 30-50% of input)
    const estimatedOutputTokens = Math.ceil(inputTokens * estimatedOutputRatio);
    const totalTokens = inputTokens + estimatedOutputTokens;

    const config = MODEL_CONFIG[this.model] || MODEL_CONFIG['gpt-4o-mini'];
    const estimatedCost =
      (inputTokens / 1000) * config.inputPrice +
      (estimatedOutputTokens / 1000) * config.outputPrice;

    return {
      inputTokens,
      estimatedOutputTokens,
      totalTokens,
      estimatedCost,
      modelContextLimit: config.contextLimit,
      withinBudget: totalTokens < config.contextLimit,
    };
  }

  /**
   * Check if request is within budget
   */
  checkBudget(estimate: TokenEstimate, budget: TokenBudget): {
    allowed: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (estimate.inputTokens > budget.maxInputTokens) {
      reasons.push(`Input tokens (${estimate.inputTokens}) exceed limit (${budget.maxInputTokens})`);
    }

    if (estimate.estimatedOutputTokens > budget.maxOutputTokens) {
      reasons.push(`Estimated output tokens (${estimate.estimatedOutputTokens}) exceed limit (${budget.maxOutputTokens})`);
    }

    if (estimate.totalTokens > budget.maxTotalTokens) {
      reasons.push(`Total tokens (${estimate.totalTokens}) exceed limit (${budget.maxTotalTokens})`);
    }

    if (estimate.estimatedCost > budget.maxCostUSD) {
      reasons.push(`Estimated cost ($${estimate.estimatedCost.toFixed(4)}) exceeds limit ($${budget.maxCostUSD})`);
    }

    if (!estimate.withinBudget) {
      reasons.push(`Total tokens exceed model context limit (${estimate.modelContextLimit})`);
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Truncate text to fit within token limit
   */
  truncateToTokenLimit(text: string, maxTokens: number): string {
    const tokens = this.encoder?.encode(text);
    if (!tokens || tokens.length <= maxTokens) {
      return text;
    }

    const truncatedTokens = tokens.slice(0, maxTokens);
    const decoded = this.encoder?.decode(truncatedTokens);
    if (decoded instanceof Uint8Array) {
      return new TextDecoder().decode(decoded);
    }
    return decoded || text.slice(0, maxTokens * 4);
  }

  /**
   * Get model configuration
   */
  getModelConfig(): { contextLimit: number; inputPrice: number; outputPrice: number } {
    return MODEL_CONFIG[this.model] || MODEL_CONFIG['gpt-4o-mini'];
  }

  /**
   * Clean up encoder resources
   */
  dispose(): void {
    if (this.encoder) {
      this.encoder.free();
      this.encoder = null;
    }
  }
}

// Singleton instance for common operations
let defaultManager: TokenManager | null = null;

export function getTokenManager(model: string = 'gpt-4o-mini'): TokenManager {
  if (!defaultManager || defaultManager['model'] !== model) {
    defaultManager?.dispose();
    defaultManager = new TokenManager(model);
  }
  return defaultManager;
}
