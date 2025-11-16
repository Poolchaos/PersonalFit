import OpenAI from 'openai';
import { IUser } from '../models/User';
import { decrypt } from '../utils/encryption';
import config from '../config';
import * as openaiService from './openaiService';

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
    // Use the detailed openaiService implementation with research-based prompts
    return openaiService.generateWorkoutPlan({
      userProfile: {
        fitness_goals: params.userProfile.fitness_goals,
        experience_level: params.userProfile.experience_level,
        activity_level: params.userProfile.activity_level,
        medical_conditions: params.userProfile.medical_conditions,
        injuries: params.userProfile.injuries,
      },
      preferences: {
        preferred_workout_duration: params.weeklySchedule?.session_duration,
        preferred_workout_days: [], // Can be expanded to include specific days
      },
      availableEquipment: params.equipment.map(name => ({
        equipment_name: name,
        equipment_type: 'other',
      })),
      workoutModality: params.workoutModality,
    }, this.client); // Pass the user's OpenAI client
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
