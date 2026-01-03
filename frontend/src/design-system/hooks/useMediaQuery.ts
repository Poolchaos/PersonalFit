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
 * Media query hook for responsive design
 */

import { useState, useEffect } from 'react';
import { breakpoints } from '../tokens/breakpoints';

type Breakpoint = keyof typeof breakpoints;

export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const query = `(min-width: ${breakpoints[breakpoint]})`;
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

// Convenience hooks for common breakpoints
export function useIsMobile() {
  return !useMediaQuery('md');
}

export function useIsTablet() {
  const isAboveMd = useMediaQuery('md');
  const isBelowLg = !useMediaQuery('lg');
  return isAboveMd && isBelowLg;
}

export function useIsDesktop() {
  return useMediaQuery('lg');
}
