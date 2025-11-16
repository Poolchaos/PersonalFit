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
    height_cm?: number;
    weight_kg?: number;
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
  const { userProfile, preferences, availableEquipment, workoutModality = 'strength' } = request;

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

Design a cardio-focused workout plan:
- Include duration-based exercises
- Specify intensity levels
- Mix steady-state and interval cardio
- Focus on heart rate zones
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
- Medical Conditions: ${userProfile.medical_conditions?.join(', ') || 'None reported'}
- Injuries: ${userProfile.injuries?.join(', ') || 'None reported'}
- Height: ${userProfile.height_cm ? `${userProfile.height_cm} cm` : 'Not specified'}
- Weight: ${userProfile.weight_kg ? `${userProfile.weight_kg} kg` : 'Not specified'}

Preferences:
- Preferred Workout Days: ${preferences.preferred_workout_days?.join(', ') || 'Flexible'}
- Preferred Duration: ${preferences.preferred_workout_duration || 45} minutes
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
1. **Evidence-Based Progression**: Apply progressive overload principles across 4 weeks (volume/intensity progression)
2. **Experience-Appropriate**: Match exercise complexity and volume to user's training age
3. **Goal-Aligned**: Primary focus on user's stated fitness goals with supporting work
4. **Equipment-Constrained**: ONLY exercises performable with available equipment
5. **Injury-Aware**: Provide modifications for any reported injuries or medical conditions
6. **Warm-up Protocol**: Include 5-10min dynamic preparation before main work
7. **Safety Emphasis**: Include form cues and injury prevention reminders based on user profile
8. **Periodization**: Week 4 should be deload (reduced volume, maintained intensity)
9. **Recovery Guidance**: Include rest day placement and recovery modality suggestions
10. **Measurable Progression**: Each week should have clear progression markers (reps, sets, tempo, or load recommendations)

VALIDATION CHECKLIST (ensure before responding):
- [ ] All exercises use ONLY available equipment
- [ ] Volume per muscle group falls within evidence-based ranges (10-20 sets/week)
- [ ] Rest intervals appropriate for training goal
- [ ] Week-to-week progression is logical and measurable
- [ ] Warm-up included for injury prevention
- [ ] Modifications provided for any reported injuries
- [ ] Week 4 implements deload for recovery`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const workoutPlan = JSON.parse(responseContent) as WorkoutPlan;
    return workoutPlan;
  } catch (error) {
    console.error('OpenAI workout generation error:', error);
    throw new Error('Failed to generate workout plan');
  }
};
