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
import config from '../config';
import { logOpenAIError } from '../utils/openaiValidator';

/**
 * SECURITY: Sanitize user input before including in AI prompts
 * Prevents prompt injection attacks by:
 * 1. Limiting length to prevent prompt bloat
 * 2. Wrapping in clear boundary markers
 * 3. Stripping potential instruction-like patterns
 */
function sanitizeUserInputForPrompt(input: string | undefined | null, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';

  // Truncate to max length
  let sanitized = input.slice(0, maxLength);

  // Remove patterns that look like instructions to the AI
  // These patterns are commonly used in jailbreak attempts
  sanitized = sanitized
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?)?/gi, '[removed]')
    .replace(/disregard\s+(all\s+)?(previous|above|prior)/gi, '[removed]')
    .replace(/forget\s+(everything|all)/gi, '[removed]')
    .replace(/new\s+instructions?:/gi, '[removed]')
    .replace(/system\s*:/gi, '[removed]')
    .replace(/assistant\s*:/gi, '[removed]')
    .replace(/```[\s\S]*?```/g, '[code block removed]') // Remove code blocks
    .replace(/\{[\s\S]*?".*?"[\s\S]*?}/g, '[json removed]'); // Remove JSON-like content

  return sanitized.trim();
}

/**
 * Wrap sanitized user input in clear boundary markers
 */
function wrapUserInput(label: string, value: string | undefined | null, maxLength: number = 500): string {
  const sanitized = sanitizeUserInputForPrompt(value, maxLength);
  if (!sanitized) return `${label}: None reported`;
  return `${label}: [USER_INPUT_START]${sanitized}[USER_INPUT_END]`;
}

// Default client using system API key (fallback)
const defaultOpenAI = new OpenAI({
  apiKey: config.openai_api_key,
});

export interface WorkoutPlanRequest {
  userProfile: {
    fitness_goals?: string[];
    experience_level?: string;
    activity_level?: string;
    medical_conditions?: string[];
    injuries?: string[];
    injuries_and_restrictions?: string;
    height_cm?: number;
    weight_kg?: number;
    current_activities?: string;
    medications?: string;
    onboarding_medications_notes?: string;
  };
  preferences: {
    preferred_workout_days?: string[];
    preferred_workout_duration?: number;
    preferred_workout_types?: string[];
    equipment_access?: string[];
  };
  availableEquipment?: Array<{
    equipment_name: string;
    equipment_type: string;
    quantity?: number;
    specifications?: Record<string, unknown>;
  }>;
  workoutModality?: 'strength' | 'hiit' | 'flexibility' | 'cardio';
  weeklySchedule?: {
    days_per_week: number;
    session_duration: number;
  };
}

export interface WorkoutPlan {
  plan_overview: {
    duration_weeks: number;
    sessions_per_week: number;
    focus_areas: string[];
    equipment_required: string[];
  };
  weekly_schedule: Array<{
    day: string;
    workout: {
      name: string;
      duration_minutes: number;
      focus: string;
      exercises: Array<{
        name: string;
        sets?: number;
        reps?: number;
        duration_seconds?: number;
        rest_seconds?: number;
        work_seconds?: number;
        rounds?: number;
        equipment?: string[];
        target_muscles: string[];
        instructions: string;
        modifications?: string;
      }>;
    };
  }>;
  progression_notes: string;
  safety_reminders: string[];
}

export const generateWorkoutPlan = async (
  request: WorkoutPlanRequest,
  openaiClient?: OpenAI
): Promise<WorkoutPlan> => {
  const openai = openaiClient || defaultOpenAI;
  const { userProfile, preferences, availableEquipment, workoutModality = 'strength', weeklySchedule } = request;
  const medicationsText = userProfile.medications;

  // Build modality-specific context
  let modalityGuidance = '';
  if (workoutModality === 'hiit') {
    modalityGuidance = `
WORKOUT TYPE: HIGH-INTENSITY INTERVAL TRAINING (HIIT)

Design a HIIT-focused workout plan with the following structure:
- Include exercises with work/rest intervals (e.g., 30 seconds work, 15 seconds rest)
- Specify rounds for each exercise or circuit
- Focus on high-intensity, explosive movements
- Include both cardio and strength-based HIIT exercises
- Provide proper warm-up and cool-down
- For each HIIT exercise, include: work_seconds, rest_seconds, and rounds fields

Example HIIT exercise format:
{
  "name": "Burpees",
  "work_seconds": 30,
  "rest_seconds": 15,
  "rounds": 4,
  "target_muscles": ["full_body", "cardiovascular"],
  "instructions": "..."
}
`;
  } else if (workoutModality === 'strength') {
    modalityGuidance = `
WORKOUT TYPE: STRENGTH TRAINING

Design a traditional strength-focused workout plan:
- Include progressive overload principles
- Specify sets and reps for each exercise
- Focus on compound and isolation movements
- Include rest periods between sets
- Provide guidance on weight selection
`;
  } else if (workoutModality === 'cardio') {
    modalityGuidance = `
WORKOUT TYPE: CARDIOVASCULAR TRAINING

Design a cardio-focused workout plan with varied modalities:
- Include duration-based exercises
- Specify intensity levels (zones 2-5)
- Mix steady-state and interval cardio
- Focus on heart rate zones for fat loss and endurance
- Include low-impact options: walking, jogging, cycling
- Include high-intensity options: running, sprints, jump rope
- Progressively increase duration or intensity each week
- For bodyweight: include exercises like jumping jacks, burpees, high knees, mountain climbers
- For equipment: utilize treadmill, stationary bike, rowing machine, jump rope
- Example activities: brisk walking (30-60min), jogging intervals (20-40min), jump rope circuits (15-25min)
`;
  } else if (workoutModality === 'flexibility') {
    modalityGuidance = `
WORKOUT TYPE: FLEXIBILITY & MOBILITY

Design a flexibility-focused workout plan:
- Include static and dynamic stretches
- Specify hold durations
- Focus on major muscle groups
- Include mobility work
`;
  }

  // Build equipment context
  let equipmentContext = 'No equipment available (bodyweight exercises only)';
  if (availableEquipment && availableEquipment.length > 0) {
    const equipmentList = availableEquipment
      .map((eq) => {
        const specs = eq.specifications
          ? ` (${Object.entries(eq.specifications)
              .filter(([_, v]) => v !== undefined && v !== null)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')})`
          : '';
        const qty = eq.quantity ? ` x${eq.quantity}` : '';
        return `- ${eq.equipment_name}${qty}${specs}`;
      })
      .join('\n');
    equipmentContext = `Available equipment:\n${equipmentList}`;
  }

  // Build user context with SANITIZED user inputs
  // SECURITY: All user-supplied text fields are sanitized to prevent prompt injection
  const sanitizedCurrentActivities = sanitizeUserInputForPrompt(userProfile.current_activities);
  const sanitizedMedications = sanitizeUserInputForPrompt(medicationsText || userProfile.onboarding_medications_notes);
  const sanitizedInjuriesRestrictions = sanitizeUserInputForPrompt(userProfile.injuries_and_restrictions, 1000);
  const sanitizedGoals = userProfile.fitness_goals?.map(g => sanitizeUserInputForPrompt(g, 100)).join(', ') || 'General fitness';
  const sanitizedConditions = userProfile.medical_conditions?.map(c => sanitizeUserInputForPrompt(c, 100)).join(', ') || 'None reported';
  const sanitizedInjuries = userProfile.injuries?.map(i => sanitizeUserInputForPrompt(i, 100)).join(', ') || 'None reported';

  const userContext = `
User Profile:
- ${wrapUserInput('Fitness Goals', sanitizedGoals, 300)}
- Experience Level: ${userProfile.experience_level || 'Not specified'}
- Activity Level: ${userProfile.activity_level || 'Not specified'}
- ${wrapUserInput('Current Regular Activities', sanitizedCurrentActivities, 300)}
- ${wrapUserInput('Medical Conditions', sanitizedConditions, 300)}
- ${wrapUserInput('Injuries', sanitizedInjuries, 300)}
- ${wrapUserInput('Medications & Supplements', sanitizedMedications, 500)}
- Height: ${userProfile.height_cm ? `${userProfile.height_cm} cm` : 'Not specified'}
- Weight: ${userProfile.weight_kg ? `${userProfile.weight_kg} kg` : 'Not specified'}

${sanitizedInjuriesRestrictions ? `
⚠️ CRITICAL SAFETY ALERT - INJURIES & RESTRICTIONS ⚠️
[USER_INPUT_START]${sanitizedInjuriesRestrictions}[USER_INPUT_END]

MANDATORY REQUIREMENTS:
1. YOU MUST CAREFULLY READ AND UNDERSTAND the above injuries and restrictions
2. NEVER include exercises that could aggravate these conditions
3. NEVER include exercises with movements that the user explicitly cannot perform
4. If an injury affects a body part, AVOID all exercises that stress that area
5. Provide SAFE ALTERNATIVES that work around the limitations
6. When in doubt about safety, EXCLUDE the exercise

Examples of restrictions to respect:
- "Knee injury" â†’ NO squats, lunges, jumping, or knee flexion under load
- "Pilonidal sinus" â†’ NO situps, crunches, or exercises with direct pressure on lower back/tailbone
- "Shoulder injury" â†’ NO overhead press, pull-ups, or shoulder-intensive movements
- "Back problems" â†’ NO deadlifts, heavy spinal loading, or high-impact exercises
- "Missing limb" â†’ Design unilateral alternatives and balance-focused modifications

USER SAFETY IS PARAMOUNT. When programming, constantly ask: "Could this exercise harm someone with these specific conditions?" If yes, EXCLUDE IT.
` : ''}

${sanitizedMedications ? `
⚠️ MEDICATION CONSIDERATIONS ⚠️
User is taking: [USER_INPUT_START]${sanitizedMedications}[USER_INPUT_END]

IMPORTANT MEDICATION-RELATED CONSIDERATIONS:
1. Some medications affect heart rate, blood pressure, or energy levels
2. Certain supplements may impact performance or recovery
3. Beta-blockers may reduce maximum heart rate capacity
4. Stimulants may increase heart rate and caffeine sensitivity
5. Consider reduced intensity or modified duration if medications affect energy/cardiac response
6. If unsure about a medication's effects on exercise, suggest moderate intensity as default
` : ''}

Weekly Schedule Requirements:
- Sessions Per Week: ${weeklySchedule?.days_per_week || preferences.preferred_workout_days?.length || 3}
- Session Duration: ${weeklySchedule?.session_duration || preferences.preferred_workout_duration || 45} minutes

IMPORTANT: The user already performs regular activities outside of this program. DO NOT duplicate these activities in the workout plan. Account for this existing activity when determining total weekly volume to avoid overtraining.

Preferences:
- Preferred Workout Days: ${preferences.preferred_workout_days?.join(', ') || 'Flexible'}
- Preferred Workout Types: ${preferences.preferred_workout_types?.join(', ') || 'Any'}

${equipmentContext}
`.trim();

  const prompt = `You are an evidence-based fitness programming specialist. Generate a workout plan based on peer-reviewed exercise science principles and the following user information:

${userContext}

${modalityGuidance}

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CRITICAL QUALITY CONTROL RULES - STRICT COMPLIANCE REQUIRED
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

âš ï¸ NO GUESSING OR ASSUMPTIONS ALLOWED âš ï¸

You MUST follow these non-negotiable quality standards:

1. **FACTUAL ONLY - NO SPECULATION**
   - Every exercise selection, set/rep scheme, and progression MUST be grounded in research
   - If user profile lacks specific data, use conservative evidence-based defaults
   - NEVER invent exercise variations or training methods not backed by literature
   - NEVER assume user capabilities beyond stated experience level
   - If uncertain about exercise appropriateness, EXCLUDE IT (safety first)

2. **EVIDENCE-BASED DECISION FRAMEWORK**
   For EVERY exercise and parameter, you must be able to answer:
   - "What research supports this selection?"
   - "Is this appropriate for the user's experience level?"
   - "Does this align with evidence-based volume/intensity guidelines?"
   - "Could this cause harm given reported injuries/conditions?"

   If you cannot confidently answer YES to all questions, DO NOT INCLUDE IT.

3. **VOLUME & INTENSITY BOUNDARIES (Non-negotiable)**
   - Beginners: 10-15 sets per muscle group per week (lower bound proven effective)
   - Intermediate: 12-20 sets per muscle group per week (optimal hypertrophy range)
   - Advanced: 15-25 sets per muscle group per week (with deload protocol)

   NEVER exceed these ranges without explicit justification.
   NEVER program volume below minimum effective dose.

4. **EXPERIENCE-APPROPRIATE COMPLEXITY**
   - Beginner: Basic compound movements, machine exercises, simple progressions
   - Intermediate: Advanced compounds, free weight variations, periodization
   - Advanced: Complex movements, advanced training methods, autoregulation

   NEVER program movements above user's stated experience level.

5. **INJURY SAFETY VERIFICATION**
   Before including ANY exercise, verify:
   - Does this movement conflict with reported injuries?
   - Could this aggravate reported medical conditions?
   - Are there safer alternatives that achieve the same training stimulus?

   When in doubt, EXCLUDE and choose safer alternative.

6. **EQUIPMENT CONSTRAINT ENFORCEMENT**
   - You may ONLY use equipment explicitly listed as available
   - NO substitutions without user approval
   - NO assumptions about equipment access
   - For bodyweight-only: Use tempo, leverage, and unilateral variations for progression

7. **PROGRESSIVE OVERLOAD VERIFICATION**
   Every week MUST show measurable progression through:
   - Increased volume (sets Ã— reps)
   - Increased intensity (load, tempo, leverage)
   - Increased complexity (exercise variation)

   Progression MUST be realistic for user's experience level.
   Week 4 MUST be deload (40-60% volume reduction).

8. **RECOVERY & FATIGUE MANAGEMENT**
   - Minimum 48 hours between training same muscle groups
   - Maximum 72 hours for heavy compound movements
   - Strategic rest day placement (avoid back-to-back high-intensity)
   - Week 4 deload is MANDATORY for recovery

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

EVIDENCE-BASED PRINCIPLES (Research-Backed Standards):

1. **Progressive Overload** (Kraemer & Ratamess, 2004; Schoenfeld et al., 2017):
   Systematically increase training stimulus through volume, intensity, or complexity over 4-week mesocycle.

2. **Frequency Guidelines** (Schoenfeld et al., 2016):
   - Beginners: 2-3 sessions/week per muscle group
   - Intermediate: 2-4 sessions/week per muscle group
   - Advanced: 4-6 sessions/week with proper periodization

3. **Volume Landmarks** (Schoenfeld et al., 2017; Baz-Valle et al., 2022):
   - Minimum Effective Volume: 10+ sets/muscle/week for growth
   - Optimal Volume: 10-20 sets/muscle/week for most individuals
   - Maximum Recoverable Volume: 20-25 sets/muscle/week (advanced only)
   - Fatigue management critical beyond 20 sets/muscle/week

4. **Rest Intervals** (Grgic et al., 2017; Henselmans & Schoenfeld, 2014):
   - Strength (>85% 1RM): 3-5 minutes between sets
   - Hypertrophy (60-80% 1RM): 1-3 minutes between sets
   - Endurance (<60% 1RM): 30-90 seconds between sets
   - HIIT: 1:1 to 1:3 work-to-rest ratios for metabolic conditioning

5. **Exercise Selection** (American College of Sports Medicine, 2009):
   - Prioritize compound movements for efficiency and functional strength
   - Include unilateral work for stability and imbalance correction
   - Match exercise complexity to user experience level
   - 70-80% compound movements, 20-30% isolation work

6. **Injury Prevention** (Soligard et al., 2010; Lauersen et al., 2014):
   - Include movement preparation (5-10min dynamic warm-up) before all sessions
   - Progressive loading: increase volume OR intensity, not both simultaneously
   - Respect reported injuries with appropriate modifications
   - Include mobility work for joint health and injury resilience

7. **Deload Strategy** (Stone et al., 1991; Rhea & Alderman, 2004):
   - Week 4 volume reduction (40-60% of week 3) to facilitate supercompensation
   - Maintain intensity, reduce volume/frequency
   - Critical for long-term progress and injury prevention

EQUIPMENT CONSTRAINT - CRITICAL:
You must ONLY use exercises performable with: ${availableEquipment && availableEquipment.length > 0 ? availableEquipment.map(e => e.equipment_name).join(', ') : 'bodyweight only (no equipment)'}

Do NOT suggest exercises requiring equipment the user doesn't have. For bodyweight-only programs, emphasize tempo manipulation, unilateral variations, and isometric holds for progressive overload.

Generate a structured 4-week mesocycle with scientific progression. Format your response as a valid JSON object matching this structure:

{
  "plan_overview": {
    "duration_weeks": 4,
    "sessions_per_week": 3-5,
    "focus_areas": ["area1", "area2"],
    "equipment_required": ["equipment1", "equipment2"]
  },
  "weekly_schedule": [
    {
      "day": "Monday",
      "workout": {
        "name": "Workout Name",
        "duration_minutes": 45,
        "focus": "Upper Body",
        "exercises": [
          {
            "name": "Exercise Name",
            "sets": 3,
            "reps": 12,
            "duration_seconds": 60,
            "rest_seconds": 60,
            "equipment": ["dumbbell"],
            "target_muscles": ["chest", "triceps"],
            "instructions": "Detailed instructions",
            "modifications": "Easier/harder variations"
          }
        ]
      }
    }
  ],
  "progression_notes": "How to progress each week",
  "safety_reminders": ["reminder1", "reminder2"]
}

PLAN REQUIREMENTS:
1. **Weekly Schedule**: MUST create exactly ${weeklySchedule?.days_per_week || 3} workout sessions per week, each approximately ${weeklySchedule?.session_duration || 45} minutes
2. **Evidence-Based Progression**: Apply progressive overload principles across 4 weeks (volume/intensity progression)
3. **Experience-Appropriate**: Match exercise complexity and volume to user's training age
4. **Goal-Aligned**: Primary focus on user's stated fitness goals with supporting work
5. **Equipment-Constrained**: ONLY exercises performable with available equipment
6. **Injury-Aware**: Provide modifications for any reported injuries or medical conditions
7. **Warm-up Protocol**: Include 5-10min dynamic preparation before main work
8. **Safety Emphasis**: Include form cues and injury prevention reminders based on user profile
9. **Periodization**: Week 4 should be deload (reduced volume, maintained intensity)
10. **Recovery Guidance**: Include rest day placement and recovery modality suggestions
11. **Measurable Progression**: Each week should have clear progression markers (reps, sets, tempo, or load recommendations)
12. **NO GUESSING**: If any aspect is unclear from user data, use conservative evidence-based defaults

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
MANDATORY PRE-RESPONSE VALIDATION CHECKLIST
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Before submitting your workout plan, you MUST verify ALL of the following:

STRUCTURE COMPLIANCE:
- [ ] Weekly schedule has EXACTLY ${weeklySchedule?.days_per_week || 3} workout sessions
- [ ] Each session is approximately ${weeklySchedule?.session_duration || 45} minutes in duration
- [ ] 4-week mesocycle structure (Weeks 1-3 progressive, Week 4 deload)

EVIDENCE-BASED VOLUME:
- [ ] Beginner: 10-15 sets per muscle group per week
- [ ] Intermediate: 12-20 sets per muscle group per week
- [ ] Advanced: 15-25 sets per muscle group per week
- [ ] Volume does NOT exceed user's experience level capacity

SAFETY VERIFICATION:
- [ ] All exercises compatible with reported injuries/restrictions
- [ ] NO exercises that could aggravate reported conditions
- [ ] Safe alternatives provided where standard exercises are contraindicated
- [ ] Dynamic warm-up included in every session (5-10 minutes)
- [ ] Progressive loading applied (NOT volume + intensity simultaneously)

EQUIPMENT CONSTRAINT:
- [ ] All exercises use ONLY available equipment: ${availableEquipment && availableEquipment.length > 0 ? availableEquipment.map(e => e.equipment_name).join(', ') : 'bodyweight only'}
- [ ] NO substitutions or assumptions about equipment access
- [ ] For bodyweight: tempo/leverage/unilateral variations for progression

EXERCISE SELECTION:
- [ ] 70-80% compound movements, 20-30% isolation work
- [ ] Exercise complexity matches user experience level
- [ ] All exercises have clear research backing for inclusion
- [ ] Target muscles aligned with user's stated goals

PERIODIZATION:
- [ ] Week 1: Foundation/assessment volume
- [ ] Week 2: Volume increase (10-15% vs Week 1)
- [ ] Week 3: Peak volume (10-15% vs Week 2)
- [ ] Week 4: Deload (40-60% of Week 3 volume, maintain intensity)
- [ ] Progressive overload clearly measurable week-to-week

RECOVERY MANAGEMENT:
- [ ] Minimum 48 hours between training same muscle groups
- [ ] Maximum 72 hours for heavy compound movements
- [ ] Strategic rest day placement (avoid back-to-back high-intensity)
- [ ] Recovery guidance provided in progression_notes

INSTRUCTION QUALITY:
- [ ] Each exercise has detailed, factual instructions
- [ ] Form cues are evidence-based (not generic)
- [ ] Modifications provided for all exercises
- [ ] Safety reminders specific to user profile

REST INTERVALS (Match training goal):
- [ ] Strength work: 3-5 minutes between sets
- [ ] Hypertrophy work: 1-3 minutes between sets
- [ ] Endurance work: 30-90 seconds between sets
- [ ] HIIT work: 1:1 to 1:3 work-to-rest ratios

QUALITY CONTROL:
- [ ] NO guessing or assumptions made
- [ ] ALL parameters grounded in research
- [ ] NO exercises beyond available equipment
- [ ] NO exercises inappropriate for experience level
- [ ] NO exercises that conflict with injuries/restrictions

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

IF YOU CANNOT CHECK ALL BOXES ABOVE, DO NOT SUBMIT THE PLAN.
Revise until 100% compliant with evidence-based standards and user constraints.

USER SAFETY AND RESEARCH INTEGRITY ARE NON-NEGOTIABLE.`;

  console.log('\n=== OpenAI Workout Generation Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User profile:', {
    experience_level: userProfile.experience_level,
    fitness_goals: userProfile.fitness_goals,
  });
  console.log('Preferences:', {
    workout_duration: preferences.preferred_workout_duration,
    workout_days: preferences.preferred_workout_days,
  });
  console.log('Weekly Schedule:', {
    days_per_week: weeklySchedule?.days_per_week,
    session_duration: weeklySchedule?.session_duration,
  });
  console.log('Workout modality:', workoutModality);
  console.log('Equipment count:', availableEquipment?.length || 0);
  console.log('\nWeekly Schedule in prompt:');
  console.log('- Sessions Per Week:', weeklySchedule?.days_per_week || preferences.preferred_workout_days?.length || 3);
  console.log('- Session Duration:', weeklySchedule?.session_duration || preferences.preferred_workout_duration || 45);

  try {
    console.log('Sending request to OpenAI...');
    const requestStartTime = Date.now();

    // Use gpt-4o-mini as default - it's more widely available and cheaper
    // Users can configure this in their AI settings if they have access to better models
    const modelToUse = 'gpt-4o-mini';
    console.log('Using model:', modelToUse);

    // SECURITY: 30-second timeout to prevent hung connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content:
              'You are an evidence-based strength and conditioning specialist with expertise in exercise science, biomechanics, and periodization. CRITICAL RULES: (1) All programming decisions MUST be grounded in peer-reviewed research - NO guessing or assumptions. (2) User safety is paramount - when in doubt about exercise safety, EXCLUDE IT. (3) Only use explicitly available equipment - NO substitutions. (4) Match complexity to stated experience level - NEVER program beyond user capabilities. (5) Respect ALL reported injuries and restrictions - provide safe alternatives. (6) Volume must fall within evidence-based ranges for experience level. Prioritize safety, progressive overload, and individualization. Always respond with valid JSON matching the requested schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }, { timeout: 30000 });

      const requestDuration = Date.now() - requestStartTime;
      console.log('✓ OpenAI request successful');
      console.log('Request duration:', requestDuration + 'ms');
      console.log('Response ID:', completion.id);
      console.log('Model used:', completion.model);
      console.log('Usage:', JSON.stringify(completion.usage));

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        console.error('✗ No response content from OpenAI');
        throw new Error('No response from OpenAI');
      }

      console.log('Response length:', responseContent.length, 'characters');
      console.log('=== OpenAI Request Complete ===\n');

      const workoutPlan = JSON.parse(responseContent) as WorkoutPlan;
      return workoutPlan;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Check for timeout/abort error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timed out after 30 seconds. Please try again.');
    }

    logOpenAIError(error, 'generateWorkoutPlan');

    // Enhanced error handling with full details
    if (error && typeof error === 'object') {
      // Check for OpenAI SDK error structure
      const sdkError = error as {
        status?: number;
        code?: string;
        type?: string;
        message?: string;
        error?: {
          message?: string;
          type?: string;
          code?: string;
          param?: string;
        };
      };

      // Log the full error structure for debugging
      console.error('Full error object:', JSON.stringify(sdkError, null, 2));

      // Check for model access errors
      if (sdkError.status === 404 || sdkError.code === 'model_not_found') {
        throw new Error('The requested AI model is not available. Your API key may not have access to this model.');
      }

      // Check for authentication errors
      if (sdkError.status === 401 || sdkError.code === 'invalid_api_key') {
        throw new Error('Invalid or expired OpenAI API key. Please update your API key in profile settings.');
      }

      // Check for rate limit
      if (sdkError.status === 429 || sdkError.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a few moments.');
      }

      // Check for quota/billing issues
      if (sdkError.status === 402 || sdkError.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing.');
      }

      // Pass through the actual error message from OpenAI
      if (sdkError.error?.message) {
        throw new Error(`OpenAI Error: ${sdkError.error.message} (code: ${sdkError.error.code || 'unknown'})`);
      }

      if (sdkError.message) {
        throw new Error(`OpenAI Error: ${sdkError.message} (status: ${sdkError.status || 'unknown'})`);
      }
    }

    // Fallback for Error instances
    if (error instanceof Error) {
      throw new Error(`Failed to generate workout plan: ${error.message}`);
    }

    throw new Error('Failed to generate workout plan. Please check your OpenAI API configuration.');
  }
};
