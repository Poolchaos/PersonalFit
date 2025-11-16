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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { workout_modality = 'strength' } = req.body;

    // Get user profile with AI config
    const user = await User.findById(req.user?.userId).select('+ai_config.api_key_encrypted');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's available equipment
    const equipment = await Equipment.find({
      user_id: req.user?.userId,
      is_available: true,
    });

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

    // Generate workout plan using configured AI provider
    const workoutPlan = await aiProvider.generateWorkoutPlan({
      userProfile: {
        experience_level: user.profile.experience_level,
        fitness_goals: user.profile.fitness_goals,
        activity_level: user.profile.activity_level,
        medical_conditions: user.profile.medical_conditions,
        injuries: user.profile.injuries,
      },
      equipment: equipment.map((eq) => eq.equipment_name),
      workoutModality: workout_modality,
      weeklySchedule: user.preferences?.workout_frequency && user.preferences?.preferred_workout_duration
        ? {
            days_per_week: user.preferences.workout_frequency,
            session_duration: user.preferences.preferred_workout_duration,
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
        user_goals: user.profile.fitness_goals,
        experience_level: user.profile.experience_level,
        equipment_used: equipment.map((eq) => eq.equipment_name),
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

    res.json({ plans });
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
