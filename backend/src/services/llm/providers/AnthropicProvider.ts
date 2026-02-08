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

import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, type ChatMessage } from '../BaseLLMProvider';
import type { LLMConfig, LLMResponse, LLMProvider } from '../types';
import {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMError,
} from '../types';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  get providerName(): LLMProvider {
    return 'anthropic';
  }

  get defaultModel(): string {
    return this.config.model || 'claude-3-5-sonnet-20241022';
  }

  get costPer1KInputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('claude-3-5-sonnet')) return 0.003;
    if (model.includes('claude-3-opus')) return 0.015;
    if (model.includes('claude-3-sonnet')) return 0.003;
    if (model.includes('claude-3-haiku')) return 0.00025;
    return 0.003; // default to claude-3.5-sonnet pricing
  }

  get costPer1KOutputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('claude-3-5-sonnet')) return 0.015;
    if (model.includes('claude-3-opus')) return 0.075;
    if (model.includes('claude-3-sonnet')) return 0.015;
    if (model.includes('claude-3-haiku')) return 0.00125;
    return 0.015; // default to claude-3.5-sonnet pricing
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
      // Anthropic requires system message to be separate
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const response = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      });

      // Extract text content from response
      const textContent = response.content.find((c) => c.type === 'text');
      const content = textContent?.type === 'text' ? textContent.text : '';

      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          estimatedCost: this.calculateCost(
            response.usage.input_tokens,
            response.usage.output_tokens
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
      // Anthropic doesn't have native structured output like OpenAI
      // We need to instruct it to return JSON matching the schema
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      // Enhance system prompt with JSON schema instructions
      const enhancedSystem = `${systemMessage?.content || ''}

IMPORTANT: You must respond ONLY with valid JSON that matches this exact schema:
${JSON.stringify(schema, null, 2)}

Do not include any text before or after the JSON. Return only the JSON object.`;

      const response = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
        system: enhancedSystem,
        messages: nonSystemMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.3, // Lower temp for structured output
      });

      // Extract and parse JSON content
      const textContent = response.content.find((c) => c.type === 'text');
      const rawContent = textContent?.type === 'text' ? textContent.text : '';

      // Try to extract JSON from the response
      let parsedContent: T;
      try {
        // Try to find JSON in the response (handles cases where there might be extra text)
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]) as T;
        } else {
          parsedContent = JSON.parse(rawContent) as T;
        }
      } catch {
        throw new InvalidRequestError(
          `Failed to parse structured output as JSON: ${rawContent.substring(0, 200)}...`,
          this.providerName
        );
      }

      return {
        content: parsedContent,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          estimatedCost: this.calculateCost(
            response.usage.input_tokens,
            response.usage.output_tokens
          ),
        },
        provider: this.providerName,
        model: response.model,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test to verify API key works
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Use cheapest model for testing
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return new AuthenticationError(
          'Invalid Anthropic API key',
          this.providerName
        );
      }
      if (error.status === 429) {
        return new RateLimitError(
          'Anthropic rate limit exceeded',
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
