import { Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Equipment from '../models/Equipment';
import WorkoutPlan from '../models/WorkoutPlan';
import { createAIProvider } from '../services/aiProviderService';
import { AuthRequest } from '../middleware/auth';

export const createWorkoutPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    console.log('=== Workout Generation Request ===');
    console.log('User ID:', req.user?.userId);
    console.log('Request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      workout_modality = 'strength',
      fitness_goals,
      experience_level,
      workout_frequency,
      preferred_workout_duration,
      equipment: equipmentParam,
    } = req.body;

    // Get user profile with AI config
    const user = await User.findById(req.user?.userId).select('+ai_config.api_key_encrypted');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('User profile:', {
      first_name: user.profile?.first_name,
      fitness_goals: user.profile?.fitness_goals,
      experience_level: user.profile?.experience_level,
      has_ai_config: !!user.ai_config,
      ai_enabled: user.ai_config?.enabled,
      ai_provider: user.ai_config?.provider,
      has_api_key: !!user.ai_config?.api_key_encrypted,
    });
    console.log('User preferences:', user.preferences);
    console.log('Request body params:', { fitness_goals, experience_level, workout_frequency, preferred_workout_duration, equipmentParam });

    // Use request body params if provided, otherwise fall back to user profile
    const finalFitnessGoals = fitness_goals || user.profile?.fitness_goals;
    const finalExperienceLevel = experience_level || user.profile?.experience_level;
    const finalWorkoutFrequency = workout_frequency || user.preferences?.workout_frequency;
    const finalWorkoutDuration = preferred_workout_duration || user.preferences?.preferred_workout_duration;

    // Get user's available equipment (or use provided equipment list)
    let equipmentList: string[];
    if (equipmentParam && Array.isArray(equipmentParam) && equipmentParam.length > 0) {
      equipmentList = equipmentParam;
    } else {
      const equipment = await Equipment.find({
        user_id: req.user?.userId,
        is_available: true,
      });
      equipmentList = equipment.map((eq) => eq.equipment_name);
    }

    // Create AI provider based on user's configuration
    let aiProvider;
    try {
      aiProvider = createAIProvider(user);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to initialize AI provider'
      });
      return;
    }

    // Validate OpenAI API key before attempting generation
    if (user.ai_config?.provider === 'openai' && user.ai_config.api_key_encrypted) {
      console.log('\n=== Validating OpenAI API Key ===');
      try {
        const { decrypt } = await import('../utils/encryption');
        const { validateOpenAIKey } = await import('../utils/openaiValidator');

        const decryptedKey = decrypt(user.ai_config.api_key_encrypted);
        const validation = await validateOpenAIKey(decryptedKey);

        if (!validation.valid) {
          console.error('API key validation failed:', {
            error: validation.error,
            errorCode: validation.errorCode,
            errorType: validation.errorType,
            details: validation.details,
          });

          res.status(401).json({
            error: validation.error || 'API key validation failed',
            errorCode: validation.errorCode,
            errorType: validation.errorType,
            details: validation.details,
          });
          return;
        }

        console.log('✓ API key validation successful:', validation.details);
      } catch (validationError) {
        console.error('Error during API key validation:', validationError);
        res.status(500).json({
          error: 'Failed to validate API key',
          details: validationError instanceof Error ? validationError.message : 'Unknown error'
        });
        return;
      }
    }

    // Generate workout plan using configured AI provider with request body params or user profile fallback
    const workoutPlan = await aiProvider.generateWorkoutPlan({
      userProfile: {
        experience_level: finalExperienceLevel,
        fitness_goals: finalFitnessGoals,
        activity_level: user.profile?.activity_level,
        medical_conditions: user.profile?.medical_conditions,
        injuries: user.profile?.injuries,
        injuries_and_restrictions: user.profile?.injuries_and_restrictions,
        current_activities: user.profile?.current_activities,
      },
      equipment: equipmentList,
      workoutModality: workout_modality,
      weeklySchedule: finalWorkoutFrequency && finalWorkoutDuration
        ? {
            days_per_week: finalWorkoutFrequency,
            session_duration: finalWorkoutDuration,
          }
        : undefined,
    });

    // Deactivate previous plans
    await WorkoutPlan.updateMany(
      { user_id: req.user?.userId, is_active: true },
      { is_active: false }
    );

    // Save new workout plan
    const newPlan = new WorkoutPlan({
      user_id: req.user?.userId,
      workout_modality,
      plan_data: workoutPlan,
      generation_context: {
        user_goals: finalFitnessGoals,
        experience_level: finalExperienceLevel,
        equipment_used: equipmentList,
        workout_modality,
      },
      is_active: true,
    });

    await newPlan.save();

    res.status(201).json({
      plan: {
        id: newPlan._id,
        plan_data: newPlan.plan_data,
        generation_context: newPlan.generation_context,
        created_at: newPlan.created_at,
      },
    });
  } catch (error) {
    console.error('Create workout plan error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    // Provide more specific error information
    let errorMessage = 'Failed to generate workout plan';
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key is missing or invalid. Please configure your AI settings.';
        statusCode = 400;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'AI service rate limit reached. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AI service request timed out. Please try again.';
        statusCode = 504;
      } else {
        errorMessage = `Failed to generate workout plan: ${error.message}`;
      }
    }

    res.status(statusCode).json({ error: errorMessage });
  }
};

export const getWorkoutPlans = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { active } = req.query;
    const filter: Record<string, unknown> = { user_id: req.user?.userId };

    if (active !== undefined) {
      filter.is_active = active === 'true';
    }

    const plans = await WorkoutPlan.find(filter)
      .sort({ created_at: -1 })
      .select('-__v');

    res.json({ workouts: plans });
  } catch (error) {
    console.error('Get workout plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWorkoutPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!plan) {
      res.status(404).json({ error: 'Workout plan not found' });
      return;
    }

    res.json({ plan });
  } catch (error) {
    console.error('Get workout plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deactivateWorkoutPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!plan) {
      res.status(404).json({ error: 'Workout plan not found' });
      return;
    }

    plan.is_active = false;
    await plan.save();

    res.json({ message: 'Workout plan deactivated successfully' });
  } catch (error) {
    console.error('Deactivate workout plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
