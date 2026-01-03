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

export const colors = {
  // Primary (Energizing Blue-Cyan)
  primary: {
    50: '#e6f9ff',
    100: '#b3ecff',
    200: '#80dfff',
    300: '#4dd2ff',
    400: '#1ac5ff',
    500: '#00b8e6',  // Base
    600: '#0099cc',
    700: '#007ab3',
    800: '#005c99',
    900: '#003d80',
  },

  // Accent Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },
  warning: {
    light: '#f59e0b',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
  achievement: {
    light: '#a78bfa',
    DEFAULT: '#8b5cf6',
    dark: '#7c3aed',
  },
  xp: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },

  // Neutral
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;
