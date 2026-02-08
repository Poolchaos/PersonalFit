/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * Multi-LLM Service - Central orchestrator for AI providers
 * Supports: OpenAI, Anthropic Claude, Google Gemini, Moonshot/Kimi
 */

import { BaseLLMProvider, type ChatMessage } from './BaseLLMProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { MoonshotProvider } from './providers/MoonshotProvider';
import type { LLMProvider, LLMResponse, RateLimitInfo } from './types';
import { LLMError } from './types';
import config from '../../config';

// Token usage tracking for analytics and billing
interface TokenUsageRecord {
  provider: LLMProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: Date;
  userId?: string;
  requestType?: string;
}

export class LLMService {
  private providers: Map<LLMProvider, BaseLLMProvider> = new Map();
  private defaultProvider: LLMProvider;
  private usageHistory: TokenUsageRecord[] = [];
  private totalTokensUsed = 0;
  private totalCost = 0;

  constructor() {
    // Use configured default provider or fall back to openai
    this.defaultProvider = (config.default_llm_provider as LLMProvider) || 'openai';
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers based on available API keys from environment
    if (config.openai_api_key) {
      this.providers.set(
        'openai',
        new OpenAIProvider({
          provider: 'openai',
          apiKey: config.openai_api_key,
          model: 'gpt-4o-mini', // Cost-effective default
        })
      );
      console.log('✓ OpenAI provider initialized');
    }

    if (config.anthropic_api_key) {
      this.providers.set(
        'anthropic',
        new AnthropicProvider({
          provider: 'anthropic',
          apiKey: config.anthropic_api_key,
          model: 'claude-3-5-sonnet-20241022',
        })
      );
      console.log('✓ Anthropic Claude provider initialized');
    }

    if (config.gemini_api_key) {
      this.providers.set(
        'gemini',
        new GeminiProvider({
          provider: 'gemini',
          apiKey: config.gemini_api_key,
          model: 'gemini-1.5-flash',
        })
      );
      console.log('✓ Google Gemini provider initialized');
    }

    if (config.moonshot_api_key) {
      this.providers.set(
        'moonshot',
        new MoonshotProvider({
          provider: 'moonshot',
          apiKey: config.moonshot_api_key,
          model: 'moonshot-v1-8k',
        })
      );
      console.log('✓ Moonshot/Kimi provider initialized');
    }

    // Log available providers
    if (this.providers.size === 0) {
      console.warn('⚠ No LLM providers configured. Set API keys in environment variables.');
    } else {
      console.log(`LLM Service: ${this.providers.size} provider(s) available - [${Array.from(this.providers.keys()).join(', ')}]`);
    }
  }

  /**
   * Get provider instance - falls back to default if requested provider unavailable
   */
  getProvider(providerName?: LLMProvider): BaseLLMProvider {
    const targetProvider = providerName || this.defaultProvider;

    const provider = this.providers.get(targetProvider);
    if (!provider) {
      // Fallback to any available provider
      const fallback = this.providers.values().next().value;
      if (!fallback) {
        throw new LLMError(
          'No LLM providers configured. Please set API keys in environment variables.',
          targetProvider
        );
      }
      console.warn(`Provider ${targetProvider} not available, falling back to ${fallback.providerName}`);
      return fallback;
    }

    return provider;
  }

  /**
   * Generate text completion with automatic provider selection and token tracking
   */
  async generateCompletion(
    messages: ChatMessage[],
    options?: {
      provider?: LLMProvider;
      temperature?: number;
      maxTokens?: number;
      model?: string;
      userId?: string;
      requestType?: string;
    }
  ): Promise<LLMResponse<string>> {
    const provider = this.getProvider(options?.provider);
    const response = await provider.generateCompletion(messages, options);

    // Track usage
    this.trackUsage({
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      estimatedCost: response.usage.estimatedCost,
      timestamp: response.timestamp,
      userId: options?.userId,
      requestType: options?.requestType,
    });

    return response;
  }

  /**
   * Generate structured JSON output with schema validation and token tracking
   */
  async generateStructuredOutput<T>(
    messages: ChatMessage[],
    schema: object,
    options?: {
      provider?: LLMProvider;
      temperature?: number;
      maxTokens?: number;
      model?: string;
      userId?: string;
      requestType?: string;
    }
  ): Promise<LLMResponse<T>> {
    const provider = this.getProvider(options?.provider);
    const response = await provider.generateStructuredOutput<T>(messages, schema, options);

    // Track usage
    this.trackUsage({
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      estimatedCost: response.usage.estimatedCost,
      timestamp: response.timestamp,
      userId: options?.userId,
      requestType: options?.requestType,
    });

    return response;
  }

  /**
   * Track token usage for analytics and billing
   */
  private trackUsage(record: TokenUsageRecord): void {
    this.usageHistory.push(record);
    this.totalTokensUsed += record.totalTokens;
    this.totalCost += record.estimatedCost;

    // Log usage (in production, this should go to a database)
    console.log(`[LLM Usage] ${record.provider}/${record.model}: ${record.totalTokens} tokens, $${record.estimatedCost.toFixed(6)}`);

    // Keep only last 1000 records in memory (older ones should be persisted)
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalTokens: number;
    totalCost: number;
    byProvider: Record<LLMProvider, { tokens: number; cost: number }>;
    recentHistory: TokenUsageRecord[];
  } {
    const byProvider: Partial<Record<LLMProvider, { tokens: number; cost: number }>> = {};

    for (const record of this.usageHistory) {
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { tokens: 0, cost: 0 };
      }
      byProvider[record.provider]!.tokens += record.totalTokens;
      byProvider[record.provider]!.cost += record.estimatedCost;
    }

    return {
      totalTokens: this.totalTokensUsed,
      totalCost: this.totalCost,
      byProvider: byProvider as Record<LLMProvider, { tokens: number; cost: number }>,
      recentHistory: this.usageHistory.slice(-50),
    };
  }

  /**
   * Get rate limit info for all providers
   */
  getAllRateLimits(): Record<LLMProvider, RateLimitInfo> {
    const limits: Partial<Record<LLMProvider, RateLimitInfo>> = {};
    this.providers.forEach((provider, name) => {
      limits[name] = provider.getRateLimitInfo();
    });
    return limits as Record<LLMProvider, RateLimitInfo>;
  }

  /**
   * Test all configured providers
   */
  async testAllProviders(): Promise<Record<LLMProvider, boolean>> {
    const results: Partial<Record<LLMProvider, boolean>> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.testConnection();
      } catch {
        results[name] = false;
      }
    }

    return results as Record<LLMProvider, boolean>;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const llmService = new LLMService();
