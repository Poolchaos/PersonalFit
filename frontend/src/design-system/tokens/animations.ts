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
 * Animation System
 * Timing functions, durations, and keyframes
 */

export const animations = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '750ms',
    slowest: '1000ms',
  },

  // Timing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideUp: {
      '0%': { transform: 'translateY(20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideLeft: {
      '0%': { transform: 'translateX(20px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideRight: {
      '0%': { transform: 'translateX(-20px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.9)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.9)', opacity: '0' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateY(0)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    wiggle: {
      '0%, 100%': { transform: 'rotate(-3deg)' },
      '50%': { transform: 'rotate(3deg)' },
    },
    confetti: {
      '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
      '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-1000px 0' },
      '100%': { backgroundPosition: '1000px 0' },
    },
    progressBar: {
      '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
      '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
    },
  },
} as const;

// Semantic animation presets
export const animationPresets = {
  fadeIn: `fadeIn ${animations.duration.normal} ${animations.easing.easeOut}`,
  fadeOut: `fadeOut ${animations.duration.normal} ${animations.easing.easeIn}`,
  slideUp: `slideUp ${animations.duration.normal} ${animations.easing.easeOut}`,
  slideDown: `slideDown ${animations.duration.normal} ${animations.easing.easeOut}`,
  slideLeft: `slideLeft ${animations.duration.normal} ${animations.easing.easeOut}`,
  slideRight: `slideRight ${animations.duration.normal} ${animations.easing.easeOut}`,
  scaleIn: `scaleIn ${animations.duration.fast} ${animations.easing.easeOut}`,
  scaleOut: `scaleOut ${animations.duration.fast} ${animations.easing.easeIn}`,
  pulse: `pulse ${animations.duration.slowest} ${animations.easing.easeInOut} infinite`,
  bounce: `bounce ${animations.duration.slowest} infinite`,
  spin: `spin ${animations.duration.slowest} ${animations.easing.linear} infinite`,
  wiggle: `wiggle ${animations.duration.normal} ${animations.easing.easeInOut}`,
  confetti: `confetti ${animations.duration.slowest} ${animations.easing.easeOut}`,
  shimmer: `shimmer ${animations.duration.slower} ${animations.easing.linear} infinite`,
  progressBar: `progressBar ${animations.duration.slow} ${animations.easing.easeOut}`,
} as const;

export type Animation = typeof animations;
export type AnimationPreset = typeof animationPresets;
