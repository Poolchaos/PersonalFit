import OpenAI from 'openai';
import { IUser } from '../models/User';
import { decrypt } from '../utils/encryption';
import config from '../config';

export interface WorkoutGenerationParams {
  userProfile: {
    experience_level?: string;
    fitness_goals?: string[];
    activity_level?: string;
    injuries?: string[];
    medical_conditions?: string[];
  };
  equipment: string[];
  workoutModality: 'strength' | 'hiit' | 'flexibility' | 'cardio';
  weeklySchedule?: {
    days_per_week: number;
    session_duration: number;
  };
}

export interface AIProvider {
  generateWorkoutPlan(params: WorkoutGenerationParams): Promise<unknown>;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateWorkoutPlan(params: WorkoutGenerationParams): Promise<unknown> {
    const prompt = this.buildPrompt(params);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert personal trainer and strength coach...',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content);
  }

  private buildPrompt(params: WorkoutGenerationParams): string {
    return `Generate a personalized ${params.workoutModality} workout plan...`;
  }
}

class AnthropicProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateWorkoutPlan(_params: WorkoutGenerationParams): Promise<unknown> {
    // TODO: Implement Anthropic API integration
    // Will use this.apiKey and _params when implemented
    console.log('Using Anthropic API key:', this.apiKey.substring(0, 10) + '...');
    throw new Error('Anthropic provider not yet implemented');
  }
}

class LocalLLMProvider implements AIProvider {
  private endpointUrl: string;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl;
  }

  async generateWorkoutPlan(_params: WorkoutGenerationParams): Promise<unknown> {
    // TODO: Implement local LLM integration (Ollama, etc.)
    // Will use this.endpointUrl and _params when implemented
    console.log('Local LLM endpoint:', this.endpointUrl);
    throw new Error('Local LLM provider not yet implemented');
  }
}

/**
 * Factory function to create appropriate AI provider based on user config
 */
export const createAIProvider = (user: IUser): AIProvider => {
  const aiConfig = user.ai_config;

  // If user has no AI config or it's disabled, use system default (if available)
  if (!aiConfig || !aiConfig.enabled) {
    if (config.openai_api_key) {
      return new OpenAIProvider(config.openai_api_key);
    }
    throw new Error(
      'AI generation not configured. Please add your API key in settings.'
    );
  }

  // Decrypt user's API key
  const apiKey = aiConfig.api_key_encrypted
    ? decrypt(aiConfig.api_key_encrypted)
    : null;

  switch (aiConfig.provider) {
    case 'openai':
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      return new OpenAIProvider(apiKey);

    case 'anthropic':
      if (!apiKey) {
        throw new Error('Anthropic API key not configured');
      }
      return new AnthropicProvider(apiKey);

    case 'local':
    case 'custom':
      if (!aiConfig.endpoint_url) {
        throw new Error('Local LLM endpoint URL not configured');
      }
      return new LocalLLMProvider(aiConfig.endpoint_url);

    default:
      throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
  }
};
