import { Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Equipment from '../models/Equipment';
import WorkoutPlan from '../models/WorkoutPlan';
import { generateWorkoutPlan } from '../services/openaiService';
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

    // Get user profile
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's available equipment
    const equipment = await Equipment.find({
      user_id: req.user?.userId,
      is_available: true,
    });

    // Generate workout plan using OpenAI
    const workoutPlan = await generateWorkoutPlan({
      userProfile: {
        fitness_goals: user.profile.fitness_goals,
        experience_level: user.profile.experience_level,
        activity_level: user.profile.activity_level,
        medical_conditions: user.profile.medical_conditions,
        injuries: user.profile.injuries,
        height_cm: user.profile.height_cm,
        weight_kg: user.profile.weight_kg,
      },
      preferences: {
        preferred_workout_days: user.preferences.preferred_workout_days,
        preferred_workout_duration: user.preferences.preferred_workout_duration,
        preferred_workout_types: user.preferences.preferred_workout_types,
        equipment_access: user.preferences.equipment_access,
      },
      availableEquipment: equipment.map((eq) => ({
        equipment_name: eq.equipment_name,
        equipment_type: eq.equipment_type,
        quantity: eq.quantity,
        specifications: eq.specifications,
      })),
      workoutModality: workout_modality,
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
    res.status(500).json({ error: 'Failed to generate workout plan' });
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
