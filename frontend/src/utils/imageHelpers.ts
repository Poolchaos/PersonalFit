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
 * Workout type to image mapping
 * Maps workout focus/type to corresponding images
 */

export function getWorkoutTypeImage(focus: string): string {
  const normalizedFocus = focus.toLowerCase();

  if (normalizedFocus.includes('strength') || normalizedFocus.includes('power')) {
    return '/images/workout-types/strength-training.jpg';
  }
  if (normalizedFocus.includes('cardio') || normalizedFocus.includes('endurance')) {
    return '/images/workout-types/cardio.jpg';
  }
  if (normalizedFocus.includes('hiit') || normalizedFocus.includes('intensity')) {
    return '/images/workout-types/hiit.jpg';
  }
  if (normalizedFocus.includes('yoga') || normalizedFocus.includes('flexibility')) {
    return '/images/workout-types/flexibility-yoga.jpg';
  }
  if (normalizedFocus.includes('recovery') || normalizedFocus.includes('mobility')) {
    return '/images/workout-types/recovery-mobility.jpg';
  }

  // Default to strength training
  return '/images/workout-types/strength-training.jpg';
}

export function getEmptyStateImage(type: 'no-workouts' | 'no-plan' | 'rest-day'): string {
  const imageMap = {
    'no-workouts': '/images/empty-states/no-workouts.jpg',
    'no-plan': '/images/empty-states/no-active-plan.jpg',
    'rest-day': '/images/empty-states/rest-day.jpg',
  };
  return imageMap[type];
}

export function getGamificationIcon(type: 'level-up' | 'streak' | 'xp' | 'first-workout' | 'week-warrior'): string {
  const iconMap = {
    'level-up': '/images/gamification/level-up-badge.png',
    'streak': '/images/gamification/streak-fire.png',
    'xp': '/images/gamification/xp-crystal.png',
    'first-workout': '/images/gamification/first-workout-trophy.png',
    'week-warrior': '/images/gamification/week-warrior-medal.png',
  };
  return iconMap[type];
}

export function getExerciseImage(exerciseName: string): string {
  const normalized = exerciseName.toLowerCase();

  if (normalized.includes('push') || normalized.includes('pushup')) {
    return '/images/exercises/pushup-demo.jpg';
  }
  if (normalized.includes('squat')) {
    return '/images/exercises/squat-demo.jpg';
  }
  if (normalized.includes('plank')) {
    return '/images/exercises/plank-demo.jpg';
  }
  if (normalized.includes('lunge')) {
    return '/images/exercises/lunge-demo.jpg';
  }
  if (normalized.includes('burpee')) {
    return '/images/exercises/burpee-demo.jpg';
  }
  if (normalized.includes('mountain') && normalized.includes('climber')) {
    return '/images/exercises/mountain-climber-demo.jpg';
  }
  if (normalized.includes('deadlift')) {
    return '/images/exercises/deadlift-demo.jpg';
  }
  if (normalized.includes('bench') && normalized.includes('press')) {
    return '/images/exercises/bench-press-demo.jpg';
  }
  if (normalized.includes('pull') && (normalized.includes('up') || normalized.includes('ups'))) {
    return '/images/exercises/pullup-demo.jpg';
  }
  if (normalized.includes('row')) {
    return '/images/exercises/dumbbell-row-demo.jpg';
  }

  // Default to pushup demo
  return '/images/exercises/pushup-demo.jpg';
}

export function getMuscleGroupImage(muscleGroup: string): string {
  const normalized = muscleGroup.toLowerCase();

  if (normalized.includes('chest') || normalized.includes('pec')) {
    return '/images/muscle-groups/chest-muscles.jpg';
  }
  if (normalized.includes('back') || normalized.includes('lat')) {
    return '/images/muscle-groups/back-muscles.jpg';
  }
  if (normalized.includes('leg') || normalized.includes('quad') || normalized.includes('hamstring') || normalized.includes('calf')) {
    return '/images/muscle-groups/leg-muscles.jpg';
  }
  if (normalized.includes('arm') || normalized.includes('bicep') || normalized.includes('tricep')) {
    return '/images/muscle-groups/arm-muscles.jpg';
  }
  if (normalized.includes('core') || normalized.includes('ab') || normalized.includes('oblique')) {
    return '/images/muscle-groups/core-muscles.jpg';
  }
  if (normalized.includes('shoulder') || normalized.includes('delt')) {
    return '/images/muscle-groups/shoulder-muscles.jpg';
  }

  // Default to core
  return '/images/muscle-groups/core-muscles.jpg';
}

export function getEquipmentImage(equipmentName: string): string {
  const normalized = equipmentName.toLowerCase();

  // Check for specific equipment first (most specific matches first)
  if (normalized.includes('jump') && normalized.includes('rope')) {
    return '/images/equipment/resistance-bands.jpg'; // Placeholder - using bands for jump rope
  }
  if (normalized.includes('kettlebell')) {
    return '/images/equipment/kettlebell.jpg';
  }
  if (normalized.includes('barbell')) {
    return '/images/equipment/barbell.jpg';
  }
  if (normalized.includes('dumbbell')) {
    return '/images/equipment/dumbbells.jpg';
  }
  if (normalized.includes('resistance') || normalized.includes('band')) {
    return '/images/equipment/resistance-bands.jpg';
  }
  if (normalized.includes('yoga') || normalized.includes('mat')) {
    return '/images/equipment/yoga-mat.jpg';
  }
  if (normalized.includes('pull') && normalized.includes('bar')) {
    return '/images/equipment/pullup-bar.jpg';
  }
  if (normalized.includes('bench')) {
    return '/images/equipment/workout-bench.jpg';
  }
  if (normalized.includes('bodyweight') || normalized.includes('none')) {
    return '/images/equipment/yoga-mat.jpg'; // Use yoga mat for bodyweight/no equipment
  }

  // Default fallback - use a neutral option
  return '/images/equipment/dumbbells.jpg';
}

export function getProgressImage(type: 'body-metrics' | 'performance-graph'): string {
  const imageMap = {
    'body-metrics': '/images/progress/body-metrics.jpg',
    'performance-graph': '/images/progress/performance-graph.jpg',
  };
  return imageMap[type];
}

export function getBackgroundImage(type: 'sunrise' | 'urban'): string {
  const imageMap = {
    'sunrise': '/images/backgrounds/sunrise-motivation.jpg',
    'urban': '/images/backgrounds/urban-fitness.jpg',
  };
  return imageMap[type];
}
