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

import { colors } from './src/design-system/tokens/colors';
import { typography } from './src/design-system/tokens/typography';
import { spacing } from './src/design-system/tokens/spacing';
import { shadows } from './src/design-system/tokens/shadows';
import { animations } from './src/design-system/tokens/animations';
import { breakpoints } from './src/design-system/tokens/breakpoints';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      letterSpacing: typography.letterSpacing,
      lineHeight: typography.lineHeight,
      spacing,
      boxShadow: shadows,
      screens: breakpoints,
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-out': 'fadeOut 300ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-left': 'slideLeft 300ms ease-out',
        'slide-right': 'slideRight 300ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'scale-out': 'scaleOut 150ms ease-in',
        'pulse': 'pulse 1000ms ease-in-out infinite',
        'bounce': 'bounce 1000ms infinite',
        'spin': 'spin 1000ms linear infinite',
        'wiggle': 'wiggle 300ms ease-in-out',
        'confetti': 'confetti 1000ms ease-out',
        'shimmer': 'shimmer 750ms linear infinite',
        'progress-bar': 'progressBar 500ms ease-out',
      },
      keyframes: animations.keyframes,
    },
  },
  plugins: [],
}
