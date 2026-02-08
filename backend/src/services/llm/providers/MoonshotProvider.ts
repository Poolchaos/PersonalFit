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

import { BaseLLMProvider, type ChatMessage } from '../BaseLLMProvider';
import type { LLMConfig, LLMResponse, LLMProvider } from '../types';
import {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMError,
} from '../types';

interface MoonshotMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MoonshotResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Moonshot/Kimi Provider - Chinese LLM with OpenAI-compatible API
 * Documentation: https://platform.moonshot.cn/docs
 */
export class MoonshotProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl = 'https://api.moonshot.cn/v1';

  constructor(config: LLMConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  get providerName(): LLMProvider {
    return 'moonshot';
  }

  get defaultModel(): string {
    return this.config.model || 'moonshot-v1-8k';
  }

  get costPer1KInputTokens(): number {
    const model = this.defaultModel;
    // Moonshot pricing (approximate, in CNY converted to USD)
    if (model.includes('moonshot-v1-128k')) return 0.0084; // ¥60/M tokens
    if (model.includes('moonshot-v1-32k')) return 0.0034; // ¥24/M tokens
    if (model.includes('moonshot-v1-8k')) return 0.0017; // ¥12/M tokens
    return 0.0017; // default to 8k pricing
  }

  get costPer1KOutputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('moonshot-v1-128k')) return 0.0084;
    if (model.includes('moonshot-v1-32k')) return 0.0034;
    if (model.includes('moonshot-v1-8k')) return 0.0017;
    return 0.0017;
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
      const response = await this.makeRequest<MoonshotResponse>('/chat/completions', {
        model: options?.model || this.defaultModel,
        messages: messages.map((m): MoonshotMessage => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          estimatedCost: this.calculateCost(
            response.usage.prompt_tokens,
            response.usage.completion_tokens
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
      // Moonshot doesn't have native structured output - use JSON prompting
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      // Enhance system prompt with JSON schema instructions
      const enhancedSystem = `${systemMessage?.content || ''}

IMPORTANT: You must respond ONLY with valid JSON that matches this exact schema:
${JSON.stringify(schema, null, 2)}

Do not include any text before or after the JSON. Return only the JSON object.`;

      const enhancedMessages: MoonshotMessage[] = [
        { role: 'system', content: enhancedSystem },
        ...nonSystemMessages.map((m): MoonshotMessage => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await this.makeRequest<MoonshotResponse>('/chat/completions', {
        model: options?.model || this.defaultModel,
        messages: enhancedMessages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
      });

      const rawContent = response.choices[0]?.message?.content || '';

      // Parse the JSON response
      let parsedContent: T;
      try {
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
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          estimatedCost: this.calculateCost(
            response.usage.prompt_tokens,
            response.usage.completion_tokens
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
      await this.makeRequest<MoonshotResponse>('/chat/completions', {
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }

  private async makeRequest<T>(endpoint: string, body: object): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
      const errorWithStatus = new Error(errorData.error?.message || `HTTP ${response.status}`) as Error & {
        status: number;
        code?: string;
      };
      errorWithStatus.status = response.status;
      errorWithStatus.code = errorData.error?.code;
      throw errorWithStatus;
    }

    return response.json() as Promise<T>;
  }

  private handleError(error: unknown): LLMError {
    const errorObj = error as { status?: number; message?: string; code?: string };

    if (errorObj.status === 401) {
      return new AuthenticationError(
        'Invalid Moonshot API key',
        this.providerName
      );
    }
    if (errorObj.status === 429) {
      return new RateLimitError(
        'Moonshot rate limit exceeded',
        this.providerName,
        {
          provider: this.providerName,
          resetTime: new Date(Date.now() + 60000),
        }
      );
    }
    if (errorObj.status === 400) {
      return new InvalidRequestError(
        `Invalid request: ${errorObj.message || 'Unknown error'}`,
        this.providerName
      );
    }

    return new LLMError(
      errorObj.message || 'Unknown error',
      this.providerName,
      errorObj.status
    );
  }
}
