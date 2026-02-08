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

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { BaseLLMProvider, type ChatMessage } from '../BaseLLMProvider';
import type { LLMConfig, LLMResponse, LLMProvider } from '../types';
import {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMError,
} from '../types';

export class GeminiProvider extends BaseLLMProvider {
  private client: GoogleGenerativeAI;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  get providerName(): LLMProvider {
    return 'gemini';
  }

  get defaultModel(): string {
    return this.config.model || 'gemini-1.5-flash';
  }

  get costPer1KInputTokens(): number {
    const model = this.defaultModel;
    // Gemini pricing (as of 2024)
    if (model.includes('gemini-1.5-pro')) return 0.00125; // $1.25 per 1M tokens
    if (model.includes('gemini-1.5-flash')) return 0.000075; // $0.075 per 1M tokens
    if (model.includes('gemini-1.0-pro')) return 0.0005;
    return 0.000075; // default to flash pricing
  }

  get costPer1KOutputTokens(): number {
    const model = this.defaultModel;
    if (model.includes('gemini-1.5-pro')) return 0.005; // $5.00 per 1M tokens
    if (model.includes('gemini-1.5-flash')) return 0.0003; // $0.30 per 1M tokens
    if (model.includes('gemini-1.0-pro')) return 0.0015;
    return 0.0003; // default to flash pricing
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
      const modelName = options?.model || this.defaultModel;
      const model = this.client.getGenerativeModel({
        model: modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
        },
      });

      // Extract system message and convert chat format
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      // Build chat history
      const history = nonSystemMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Get the last user message
      const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];
      const userMessage = systemMessage
        ? `${systemMessage.content}\n\n${lastMessage?.content || ''}`
        : lastMessage?.content || '';

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const response = result.response;

      // Estimate tokens (Gemini doesn't always return token counts)
      const promptTokens = await model.countTokens(userMessage);
      const completionTokens = await model.countTokens(response.text());

      return {
        content: response.text(),
        usage: {
          promptTokens: promptTokens.totalTokens,
          completionTokens: completionTokens.totalTokens,
          totalTokens: promptTokens.totalTokens + completionTokens.totalTokens,
          estimatedCost: this.calculateCost(
            promptTokens.totalTokens,
            completionTokens.totalTokens
          ),
        },
        provider: this.providerName,
        model: modelName,
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
      const modelName = options?.model || this.defaultModel;
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens ?? 4000,
          responseMimeType: 'application/json',
        },
      });

      // Extract system message
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      // Enhance with JSON schema instructions
      const enhancedPrompt = `${systemMessage?.content || ''}

You must respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

${nonSystemMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      const rawContent = response.text();

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

      // Estimate tokens
      const promptTokens = await model.countTokens(enhancedPrompt);
      const completionTokens = await model.countTokens(rawContent);

      return {
        content: parsedContent,
        usage: {
          promptTokens: promptTokens.totalTokens,
          completionTokens: completionTokens.totalTokens,
          totalTokens: promptTokens.totalTokens + completionTokens.totalTokens,
          estimatedCost: this.calculateCost(
            promptTokens.totalTokens,
            completionTokens.totalTokens
          ),
        },
        provider: this.providerName,
        model: modelName,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Hi');
      return true;
    } catch {
      return false;
    }
  }

  private handleError(error: unknown): LLMError {
    const errorObj = error as { status?: number; message?: string; code?: string };

    if (errorObj.status === 401 || errorObj.code === 'UNAUTHENTICATED') {
      return new AuthenticationError(
        'Invalid Google Gemini API key',
        this.providerName
      );
    }
    if (errorObj.status === 429 || errorObj.code === 'RESOURCE_EXHAUSTED') {
      return new RateLimitError(
        'Gemini rate limit exceeded',
        this.providerName,
        {
          provider: this.providerName,
          resetTime: new Date(Date.now() + 60000),
        }
      );
    }
    if (errorObj.status === 400 || errorObj.code === 'INVALID_ARGUMENT') {
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
