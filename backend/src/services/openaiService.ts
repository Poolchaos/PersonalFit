import OpenAI from 'openai';
import config from '../config';

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

  // Build user context
  const userContext = `
User Profile:
- Fitness Goals: ${userProfile.fitness_goals?.join(', ') || 'General fitness'}
- Experience Level: ${userProfile.experience_level || 'Not specified'}
- Activity Level: ${userProfile.activity_level || 'Not specified'}
- Current Regular Activities: ${userProfile.current_activities || 'None reported'}
- Medical Conditions: ${userProfile.medical_conditions?.join(', ') || 'None reported'}
- Injuries: ${userProfile.injuries?.join(', ') || 'None reported'}
- Height: ${userProfile.height_cm ? `${userProfile.height_cm} cm` : 'Not specified'}
- Weight: ${userProfile.weight_kg ? `${userProfile.weight_kg} kg` : 'Not specified'}

${userProfile.injuries_and_restrictions ? `
⚠️ CRITICAL SAFETY ALERT - INJURIES & RESTRICTIONS ⚠️
${userProfile.injuries_and_restrictions}

MANDATORY REQUIREMENTS:
1. YOU MUST CAREFULLY READ AND UNDERSTAND the above injuries and restrictions
2. NEVER include exercises that could aggravate these conditions
3. NEVER include exercises with movements that the user explicitly cannot perform
4. If an injury affects a body part, AVOID all exercises that stress that area
5. Provide SAFE ALTERNATIVES that work around the limitations
6. When in doubt about safety, EXCLUDE the exercise

Examples of restrictions to respect:
- "Knee injury" → NO squats, lunges, jumping, or knee flexion under load
- "Pilonidal sinus" → NO situps, crunches, or exercises with direct pressure on lower back/tailbone
- "Shoulder injury" → NO overhead press, pull-ups, or shoulder-intensive movements
- "Back problems" → NO deadlifts, heavy spinal loading, or high-impact exercises
- "Missing limb" → Design unilateral alternatives and balance-focused modifications

USER SAFETY IS PARAMOUNT. When programming, constantly ask: "Could this exercise harm someone with these specific conditions?" If yes, EXCLUDE IT.
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

EVIDENCE-BASED PRINCIPLES (Apply to all programming):

1. **Progressive Overload** (Kraemer & Ratamess, 2004): Systematically increase training stimulus through volume, intensity, or complexity over 4-week mesocycle.

2. **Frequency Guidelines** (Schoenfeld et al., 2016):
   - Beginners: 2-3 sessions/week per muscle group
   - Intermediate: 2-4 sessions/week per muscle group
   - Advanced: 4-6 sessions/week with proper periodization

3. **Volume Landmarks** (Schoenfeld et al., 2017):
   - Minimum Effective Volume: 10+ sets/muscle/week for growth
   - Maximum Adaptive Volume: 10-20 sets/muscle/week for most individuals
   - Fatigue management critical beyond 20 sets/muscle/week

4. **Rest Intervals** (Grgic et al., 2017):
   - Strength (>85% 1RM): 3-5 minutes between sets
   - Hypertrophy (60-80% 1RM): 1-3 minutes between sets
   - Endurance (<60% 1RM): 30-90 seconds between sets
   - HIIT: 1:1 to 1:3 work-to-rest ratios for metabolic conditioning

5. **Exercise Selection** (American College of Sports Medicine, 2009):
   - Prioritize compound movements for efficiency and functional strength
   - Include unilateral work for stability and imbalance correction
   - Match exercise complexity to user experience level

6. **Injury Prevention** (Soligard et al., 2010):
   - Include movement preparation (dynamic warm-up) before all sessions
   - Progressive loading: increase volume OR intensity, not both simultaneously
   - Respect reported injuries with appropriate modifications
   - Include mobility work for joint health

7. **Deload Strategy** (Stone et al., 1991):
   - Week 4 volume reduction (40-60% of week 3) to facilitate supercompensation
   - Maintain intensity, reduce volume/frequency

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

VALIDATION CHECKLIST (ensure before responding):
- [ ] Weekly schedule has EXACTLY ${weeklySchedule?.days_per_week || 3} workout sessions
- [ ] Each session is approximately ${weeklySchedule?.session_duration || 45} minutes in duration
- [ ] All exercises use ONLY available equipment
- [ ] Volume per muscle group falls within evidence-based ranges (10-20 sets/week)
- [ ] Rest intervals appropriate for training goal
- [ ] Week-to-week progression is logical and measurable
- [ ] Warm-up included for injury prevention
- [ ] Modifications provided for any reported injuries
- [ ] Week 4 implements deload for recovery`;

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

    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content:
            'You are an evidence-based strength and conditioning specialist with expertise in exercise science, biomechanics, and periodization. All programming decisions must be grounded in peer-reviewed research. Prioritize safety, progressive overload, and individualization. Always respond with valid JSON matching the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

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
  } catch (error) {
    const { logOpenAIError } = await import('../utils/openaiValidator');
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
