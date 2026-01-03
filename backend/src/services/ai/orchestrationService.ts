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
 * AI Orchestration Service - LangGraph-inspired multi-agent workflow
 * Implements Planner â†’ Worker â†’ Reviewer pattern with state management
 */

import { EventEmitter } from 'events';
import {
  AIProvider,
  AgentResult,
  AgentAttempt,
  OrchestrationPlan,
  WorkoutPlan,
  WorkoutPlanSchema,
  StreamCallback,
  DEFAULT_RETRY_CONFIG,
} from './types';
import { TokenManager, DEFAULT_WORKOUT_BUDGET } from './tokenManager';
import { withRetry } from './retryUtils';
import { parseAIResponse, createValidationErrorPrompt } from './responseValidator';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';
import { decrypt } from '../../utils/encryption';

// ============================================
// State Machine Types
// ============================================

type WorkflowState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'refining'
  | 'completed'
  | 'failed';

interface WorkflowContext {
  state: WorkflowState;
  taskId: string;
  userId: string;
  input: Record<string, unknown>;
  plan?: OrchestrationPlan;
  currentStep: number;
  attempts: AgentAttempt[];
  intermediateResults: Record<string, unknown>;
  finalResult?: unknown;
  error?: string;
  startTime: number;
  tokenManager: TokenManager;
}

// ============================================
// Agent Definitions
// ============================================

const PLANNER_SYSTEM_PROMPT = `You are a Fitness Planning Strategist. Your role is to analyze user requirements and create a structured plan for generating personalized workout programs.

Given user fitness data, you must:
1. Identify the user's fitness level, goals, and constraints
2. Determine the optimal workout structure (days per week, session types)
3. Consider equipment availability and any limitations
4. Suggest exercise categories and progression strategies
5. Output a structured plan that the Worker agent can execute

Respond with a JSON object containing:
{
  "analysis": "Brief analysis of user needs",
  "recommendedStructure": {
    "sessionsPerWeek": number,
    "sessionTypes": string[],
    "focusAreas": string[],
    "progressionStrategy": string
  },
  "constraints": string[],
  "instructions": "Detailed instructions for generating the workout plan"
}`;

const WORKER_SYSTEM_PROMPT = `You are a Fitness Program Generator. Your role is to create detailed, personalized workout plans based on the planning strategy provided.

You must generate complete workout plans with:
1. Specific exercises with sets, reps, and rest periods
2. Warmup and cooldown routines
3. Progressive overload considerations
4. Alternative exercises for equipment limitations
5. Clear instructions and form cues

CRITICAL: Your output MUST be valid JSON matching this schema:
{
  "name": "Plan name (max 100 chars)",
  "description": "Brief description (max 500 chars)",
  "goal": "User's primary goal",
  "durationWeeks": 4-12,
  "sessionsPerWeek": 1-7,
  "sessions": [
    {
      "dayOfWeek": 0-6 (0=Sunday),
      "sessionType": "strength|cardio|hiit|flexibility|mixed|rest",
      "duration": minutes,
      "warmup": [{ exercise objects }],
      "mainWorkout": [{ exercise objects }],
      "cooldown": [{ exercise objects }],
      "notes": "Optional notes",
      "calorieEstimate": number
    }
  ],
  "progressionNotes": "How to progress over time",
  "adaptations": { "condition": "modification" }
}

Each exercise object must have:
{
  "name": "Exercise name",
  "category": "strength|cardio|flexibility|balance|hiit",
  "sets": number (for strength),
  "reps": number or "12-15" (for strength),
  "duration": "30 seconds" (for cardio/flexibility),
  "restSeconds": number,
  "notes": "Form cues or modifications",
  "equipment": ["list", "of", "equipment"],
  "muscleGroups": ["primary", "muscles"],
  "difficulty": "beginner|intermediate|advanced"
}`;

const REVIEWER_SYSTEM_PROMPT = `You are a Fitness Program Quality Reviewer. Your role is to evaluate workout plans for safety, effectiveness, and adherence to user requirements.

Review criteria:
1. SAFETY: Check for overtraining, adequate rest, proper exercise order
2. BALANCE: Ensure muscle group balance, push/pull ratios, mobility work
3. PROGRESSION: Verify progressive overload is achievable
4. PERSONALIZATION: Confirm plan matches user's level and equipment
5. COMPLETENESS: All required fields present and valid

Respond with JSON:
{
  "approved": boolean,
  "score": 1-100,
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "category": "safety|balance|progression|personalization|completeness",
      "description": "Issue description",
      "recommendation": "How to fix"
    }
  ],
  "refinements": "Specific changes needed if not approved"
}`;

// ============================================
// Orchestration Service
// ============================================

export class AIOrchestrationService extends EventEmitter {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private tokenManager: TokenManager;
  private defaultModel: string;
  private defaultProvider: AIProvider;

  constructor(model: string = 'gpt-4o-mini', provider: AIProvider = 'openai') {
    super();
    this.defaultModel = model;
    this.defaultProvider = provider;
    this.tokenManager = new TokenManager(model);
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize OpenAI
    const openaiKey = config.openai_api_key;
    if (openaiKey) {
      try {
        const decryptedKey = decrypt(openaiKey);
        this.openai = new OpenAI({ apiKey: decryptedKey });
      } catch {
        // Key might not be encrypted
        this.openai = new OpenAI({ apiKey: openaiKey });
      }
    }

    // Initialize Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const decryptedKey = decrypt(anthropicKey);
        this.anthropic = new Anthropic({ apiKey: decryptedKey });
      } catch {
        // Key might not be encrypted
        this.anthropic = new Anthropic({ apiKey: anthropicKey });
      }
    }
  }

  /**
   * Generate workout plan using multi-agent orchestration
   */
  async generateWorkoutPlan(
    userId: string,
    userProfile: Record<string, unknown>,
    options: {
      streaming?: boolean;
      onStream?: StreamCallback;
      maxRetries?: number;
    } = {}
  ): Promise<AgentResult<WorkoutPlan>> {
    const taskId = `workout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const context: WorkflowContext = {
      state: 'idle',
      taskId,
      userId,
      input: userProfile,
      currentStep: 0,
      attempts: [],
      intermediateResults: {},
      startTime: Date.now(),
      tokenManager: this.tokenManager,
    };

    try {
      // Phase 1: Planning
      this.emit('phase', { taskId, phase: 'planning' });
      context.state = 'planning';

      const plannerResult = await this.executePlannerAgent(context, userProfile);
      context.intermediateResults['plan'] = plannerResult;

      // Phase 2: Execution
      this.emit('phase', { taskId, phase: 'executing' });
      context.state = 'executing';

      const workerResult = await this.executeWorkerAgent(
        context,
        plannerResult,
        options.streaming ? options.onStream : undefined
      );

      // Phase 3: Review
      this.emit('phase', { taskId, phase: 'reviewing' });
      context.state = 'reviewing';

      const reviewResult = await this.executeReviewerAgent(context, workerResult);

      // Phase 4: Refinement (if needed)
      let finalPlan = workerResult;
      if (!reviewResult.approved && reviewResult.refinements) {
        this.emit('phase', { taskId, phase: 'refining' });
        context.state = 'refining';

        finalPlan = await this.executeRefinement(context, workerResult, reviewResult);
      }

      // Validate final output
      const validation = parseAIResponse(JSON.stringify(finalPlan), WorkoutPlanSchema);
      if (!validation.success || !validation.data) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      context.state = 'completed';
      context.finalResult = validation.data;

      return this.buildAgentResult(context, validation.data);

    } catch (error) {
      context.state = 'failed';
      context.error = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: context.error,
        attempts: context.attempts,
        totalTokens: this.calculateTotalTokens(context),
        totalCost: this.calculateTotalCost(context),
        totalLatencyMs: Date.now() - context.startTime,
      };
    }
  }

  /**
   * Execute the Planner agent
   */
  private async executePlannerAgent(
    context: WorkflowContext,
    userProfile: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const userPrompt = this.buildPlannerPrompt(userProfile);

    const result = await this.executeWithRetry(
      PLANNER_SYSTEM_PROMPT,
      userPrompt,
      context
    );

    try {
      return JSON.parse(result);
    } catch {
      // If not valid JSON, wrap it
      return { instructions: result };
    }
  }

  /**
   * Execute the Worker agent
   */
  private async executeWorkerAgent(
    context: WorkflowContext,
    plan: Record<string, unknown>,
    onStream?: StreamCallback
  ): Promise<WorkoutPlan> {
    const userPrompt = this.buildWorkerPrompt(context.input, plan);

    let result: string;

    if (onStream) {
      result = await this.executeWithStreaming(
        WORKER_SYSTEM_PROMPT,
        userPrompt,
        onStream,
        context
      );
    } else {
      result = await this.executeWithRetry(
        WORKER_SYSTEM_PROMPT,
        userPrompt,
        context
      );
    }

    const validation = parseAIResponse(result, WorkoutPlanSchema);

    if (!validation.success) {
      // Try to fix with a clarification prompt
      const errorPrompt = createValidationErrorPrompt(validation.errors || []);
      const fixedResult = await this.executeWithRetry(
        WORKER_SYSTEM_PROMPT,
        `${userPrompt}\n\n${errorPrompt}\n\nPrevious response:\n${result}`,
        context
      );

      const retryValidation = parseAIResponse(fixedResult, WorkoutPlanSchema);
      if (!retryValidation.success) {
        throw new Error(`Worker output validation failed after retry: ${JSON.stringify(retryValidation.errors)}`);
      }

      return retryValidation.data!;
    }

    return validation.data!;
  }

  /**
   * Execute the Reviewer agent
   */
  private async executeReviewerAgent(
    context: WorkflowContext,
    workoutPlan: WorkoutPlan
  ): Promise<{ approved: boolean; score: number; refinements?: string }> {
    const userPrompt = this.buildReviewerPrompt(context.input, workoutPlan);

    const result = await this.executeWithRetry(
      REVIEWER_SYSTEM_PROMPT,
      userPrompt,
      context
    );

    try {
      const review = JSON.parse(result);
      return {
        approved: review.approved ?? review.score >= 80,
        score: review.score ?? 0,
        refinements: review.refinements,
      };
    } catch {
      // If parsing fails, assume approved
      return { approved: true, score: 70 };
    }
  }

  /**
   * Execute refinement based on reviewer feedback
   */
  private async executeRefinement(
    context: WorkflowContext,
    originalPlan: WorkoutPlan,
    reviewResult: { refinements?: string }
  ): Promise<WorkoutPlan> {
    const userPrompt = `Original plan:\n${JSON.stringify(originalPlan, null, 2)}\n\nReviewer feedback:\n${reviewResult.refinements}\n\nPlease refine the workout plan to address the feedback while maintaining the overall structure.`;

    const result = await this.executeWithRetry(
      WORKER_SYSTEM_PROMPT,
      userPrompt,
      context
    );

    const validation = parseAIResponse(result, WorkoutPlanSchema);
    return validation.success ? validation.data! : originalPlan;
  }

  /**
   * Execute AI request with retry logic
   */
  private async executeWithRetry(
    systemPrompt: string,
    userPrompt: string,
    context: WorkflowContext
  ): Promise<string> {
    // Pre-flight token check
    const estimate = this.tokenManager.estimateRequest(systemPrompt, userPrompt);
    const budgetCheck = this.tokenManager.checkBudget(estimate, DEFAULT_WORKOUT_BUDGET);

    if (!budgetCheck.allowed) {
      throw new Error(`Token budget exceeded: ${budgetCheck.reasons.join(', ')}`);
    }

    const retryResult = await withRetry(
      async (model: string, _attempt: number) => {
        const startTime = Date.now();
        void _attempt; // Used for logging/debugging

        const response = await this.callAI(systemPrompt, userPrompt, model);

        const attemptRecord: AgentAttempt = {
          agentRole: 'worker',
          input: userPrompt.slice(0, 200) + '...',
          output: response.slice(0, 200) + '...',
          timestamp: new Date(),
          latencyMs: Date.now() - startTime,
          tokensUsed: estimate.inputTokens + (response.length / 4), // Rough output estimate
        };
        context.attempts.push(attemptRecord);

        return response;
      },
      this.defaultModel,
      { maxRetries: DEFAULT_RETRY_CONFIG.maxRetries }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error('AI request failed after retries');
    }

    return retryResult.data!;
  }

  /**
   * Execute AI request with streaming
   */
  private async executeWithStreaming(
    systemPrompt: string,
    userPrompt: string,
    onStream: StreamCallback,
    context: WorkflowContext
  ): Promise<string> {
    const chunks: string[] = [];

    if (this.defaultProvider === 'openai' && this.openai) {
      const stream = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          chunks.push(content);
          onStream({ type: 'content', content });
        }
      }

      onStream({ type: 'done' });

    } else if (this.defaultProvider === 'anthropic' && this.anthropic) {
      const stream = await this.anthropic.messages.stream({
        model: this.defaultModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const content = event.delta.text;
          chunks.push(content);
          onStream({ type: 'content', content });
        }
      }

      onStream({ type: 'done' });
    } else {
      // Fallback to non-streaming
      const result = await this.executeWithRetry(systemPrompt, userPrompt, context);
      onStream({ type: 'content', content: result });
      onStream({ type: 'done' });
      return result;
    }

    return chunks.join('');
  }

  /**
   * Call AI provider
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    model: string
  ): Promise<string> {
    const provider = this.getProviderForModel(model);

    if (provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';

    } else if (provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock?.text || '';
    }

    throw new Error(`No AI provider available for model: ${model}`);
  }

  /**
   * Determine provider from model name
   */
  private getProviderForModel(model: string): AIProvider {
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gpt') || model.includes('o1')) return 'openai';
    return 'openai'; // Default
  }

  /**
   * Build prompt for planner agent
   */
  private buildPlannerPrompt(userProfile: Record<string, unknown>): string {
    return `Analyze the following user profile and create a workout planning strategy:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Consider:
1. Fitness level and experience
2. Goals (weight loss, muscle gain, endurance, etc.)
3. Available equipment
4. Time constraints
5. Any limitations or preferences

Provide a structured planning strategy for the workout generator.`;
  }

  /**
   * Build prompt for worker agent
   */
  private buildWorkerPrompt(
    userProfile: Record<string, unknown>,
    plan: Record<string, unknown>
  ): string {
    return `Generate a complete, personalized workout plan based on the following:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Planning Strategy:
${JSON.stringify(plan, null, 2)}

Create a detailed workout plan with all exercises, sets, reps, and rest periods.
Ensure the plan is safe, progressive, and achievable for the user's fitness level.

IMPORTANT: Output must be valid JSON matching the WorkoutPlan schema exactly.`;
  }

  /**
   * Build prompt for reviewer agent
   */
  private buildReviewerPrompt(
    userProfile: Record<string, unknown>,
    workoutPlan: WorkoutPlan
  ): string {
    return `Review the following workout plan for safety, effectiveness, and personalization:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Generated Workout Plan:
${JSON.stringify(workoutPlan, null, 2)}

Evaluate the plan against all quality criteria and provide your assessment.`;
  }

  /**
   * Build final agent result
   */
  private buildAgentResult<T>(context: WorkflowContext, data: T): AgentResult<T> {
    return {
      success: true,
      data,
      attempts: context.attempts,
      totalTokens: this.calculateTotalTokens(context),
      totalCost: this.calculateTotalCost(context),
      totalLatencyMs: Date.now() - context.startTime,
    };
  }

  /**
   * Calculate total tokens used
   */
  private calculateTotalTokens(context: WorkflowContext): number {
    return context.attempts.reduce((sum, attempt) => sum + attempt.tokensUsed, 0);
  }

  /**
   * Calculate total cost
   */
  private calculateTotalCost(context: WorkflowContext): number {
    const config = this.tokenManager.getModelConfig();
    const totalTokens = this.calculateTotalTokens(context);
    // Rough estimate: 60% input, 40% output
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    return (inputTokens / 1000) * config.inputPrice + (outputTokens / 1000) * config.outputPrice;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.tokenManager.dispose();
    this.removeAllListeners();
  }
}

// Export singleton factory
let orchestrationInstance: AIOrchestrationService | null = null;

export function getOrchestrationService(
  model?: string,
  provider?: AIProvider
): AIOrchestrationService {
  if (!orchestrationInstance) {
    orchestrationInstance = new AIOrchestrationService(model, provider);
  }
  return orchestrationInstance;
}
