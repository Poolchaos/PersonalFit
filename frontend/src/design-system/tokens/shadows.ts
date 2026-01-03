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
 * Shadow System
 * Elevation levels using box-shadow
 */

export const shadows = {
  // Base shadows
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Colored shadows for emphasis
  'primary-glow': '0 0 20px rgba(0, 184, 230, 0.4)',
  'success-glow': '0 0 20px rgba(16, 185, 129, 0.4)',
  'warning-glow': '0 0 20px rgba(245, 158, 11, 0.4)',
  'error-glow': '0 0 20px rgba(239, 68, 68, 0.4)',
  'achievement-glow': '0 0 20px rgba(168, 85, 247, 0.4)',

  // Focus rings
  'focus-ring': '0 0 0 3px rgba(0, 184, 230, 0.2)',
  'focus-ring-error': '0 0 0 3px rgba(239, 68, 68, 0.2)',
  'focus-ring-success': '0 0 0 3px rgba(16, 185, 129, 0.2)',
} as const;

// Semantic shadow presets
export const shadowPresets = {
  card: shadows.sm,
  cardHover: shadows.md,
  modal: shadows.xl,
  dropdown: shadows.lg,
  button: shadows.sm,
  buttonActive: shadows.xs,
  tooltip: shadows.md,
  popover: shadows.lg,
} as const;

export type Shadow = typeof shadows;
export type ShadowPreset = typeof shadowPresets;
