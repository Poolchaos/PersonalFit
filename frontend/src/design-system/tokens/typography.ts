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
 * Typography System
 * Font families, sizes, weights, and line heights
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },

  // Font Sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px / 16px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px / 20px
    base: ['1rem', { lineHeight: '1.5rem' }],    // 16px / 24px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px / 28px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px / 28px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px / 32px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px / 36px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px / 40px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
    '8xl': ['6rem', { lineHeight: '1' }],          // 96px
    '9xl': ['8rem', { lineHeight: '1' }],          // 128px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// Semantic typography presets
export const typographyPresets = {
  // Display text
  displayLarge: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  displayMedium: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  displaySmall: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Headings
  h1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  h4: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },

  // Body text
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },

  // Labels
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
  },
  labelSmall: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
  },

  // Buttons
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Code
  code: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
  },
  codeSmall: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.xs,
  },
} as const;

export type Typography = typeof typography;
export type TypographyPreset = typeof typographyPresets;
