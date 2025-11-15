import OpenAI from 'openai';
import config from '../config';

const openai = new OpenAI({
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
  request: WorkoutPlanRequest
): Promise<WorkoutPlan> => {
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

  const prompt = `You are a certified fitness trainer creating a personalized workout plan. Generate a comprehensive, safe, and effective workout plan based on the following user information:

${userContext}

${modalityGuidance}

CRITICAL: You must ONLY use exercises that can be performed with the equipment listed above. If no equipment is available, use only bodyweight exercises. Do not suggest exercises requiring equipment the user doesn't have.

Generate a structured 4-week workout plan with specific exercises and progression guidance. Format your response as a valid JSON object matching this structure:

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

Ensure the plan:
1. Matches the user's experience level and goals
2. Respects any medical conditions or injuries
3. ONLY uses the equipment available to the user
4. Includes proper warm-up and cool-down exercises
5. Provides clear progression guidance
6. Includes safety reminders specific to the user's situation`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a certified fitness trainer with expertise in personalized workout programming. Always respond with valid JSON.',
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
