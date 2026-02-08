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

import OpenAI from 'openai';
import { BaseLLMProvider, type ChatMessage } from '../BaseLLMProvider';
import type { LLMConfig, LLMResponse, LLMProvider } from '../types';
import {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMError,
} from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  get providerName(): LLMProvider {
    return 'openai';
  }

  get defaultModel(): string {
    return this.config.model || 'gpt-4o-mini';
  }

  get costPer1KInputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('gpt-4o')) return 0.0025;
    if (model.includes('gpt-4-turbo')) return 0.01;
    if (model.includes('gpt-4')) return 0.03;
    if (model.includes('gpt-3.5-turbo')) return 0.0005;
    return 0.0025; // default to gpt-4o pricing
  }

  get costPer1KOutputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('gpt-4o')) return 0.01;
    if (model.includes('gpt-4-turbo')) return 0.03;
    if (model.includes('gpt-4')) return 0.06;
    if (model.includes('gpt-3.5-turbo')) return 0.0015;
    return 0.01; // default to gpt-4o pricing
  }

  async generateCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResponse<string>> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
      });

      // Parse rate limit headers if available
      this.updateRateLimitInfo(response);

      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost: this.calculateCost(
            usage.prompt_tokens,
            usage.completion_tokens
          ),
        },
        provider: this.providerName,
        model: response.model,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateStructuredOutput<T>(
    messages: ChatMessage[],
    schema: object,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResponse<T>> {
    try {
      // Use JSON mode with schema instructions in the system message
      const schemaInstruction = `You must respond with valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}\n\nRespond ONLY with valid JSON, no additional text.`;

      const messagesWithSchema = [
        ...messages.slice(0, -1),
        {
          role: messages[messages.length - 1]?.role || ('user' as const),
          content: `${messages[messages.length - 1]?.content || ''}\n\n${schemaInstruction}`,
        },
      ];

      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messagesWithSchema.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
        response_format: { type: 'json_object' },
      });

      this.updateRateLimitInfo(response);

      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const content = response.choices[0]?.message?.content || '{}';
      let parsedContent: T;
      try {
        parsedContent = JSON.parse(content) as T;
      } catch {
        throw new Error('Failed to parse structured output as JSON');
      }

      return {
        content: parsedContent,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost: this.calculateCost(
            usage.prompt_tokens,
            usage.completion_tokens
          ),
        },
        provider: this.providerName,
        model: response.model,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  private updateRateLimitInfo(_response: unknown): void {
    // OpenAI doesn't provide rate limit info in response headers via SDK
    // Would need to access raw headers which isn't available in this API
    // In production, implement custom retry logic with exponential backoff
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return new AuthenticationError(
          'Invalid OpenAI API key',
          this.providerName
        );
      }
      if (error.status === 429) {
        return new RateLimitError(
          'OpenAI rate limit exceeded',
          this.providerName,
          {
            provider: this.providerName,
            resetTime: new Date(Date.now() + 60000), // Estimate 1 min
          }
        );
      }
      if (error.status === 400) {
        return new InvalidRequestError(
          `Invalid request: ${error.message}`,
          this.providerName
        );
      }
      return new LLMError(error.message, this.providerName, error.status);
    }

    return new LLMError(
      error instanceof Error ? error.message : 'Unknown error',
      this.providerName
    );
  }
}
