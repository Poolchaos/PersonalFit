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
 * Breakpoint System
 * Responsive design breakpoints
 */

export const breakpoints = {
  xs: '0px',       // Mobile (portrait)
  sm: '640px',     // Mobile (landscape)
  md: '768px',     // Tablet
  lg: '1024px',    // Desktop
  xl: '1280px',    // Large desktop
  '2xl': '1536px', // Extra large desktop
} as const;

// Media query helpers
export const media = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,
} as const;

export type Breakpoint = typeof breakpoints;
export type Media = typeof media;
