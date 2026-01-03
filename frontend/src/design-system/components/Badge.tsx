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
 * Badge Component
 * Small status and category indicators
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700 hover:bg-primary-200',
        secondary: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200',
        success: 'bg-success-100 text-success-700 hover:bg-success-200',
        warning: 'bg-warning-100 text-warning-700 hover:bg-warning-200',
        error: 'bg-error-100 text-error-700 hover:bg-error-200',
        achievement: 'bg-achievement-100 text-achievement-700 hover:bg-achievement-200',
        xp: 'bg-xp-100 text-xp-700 hover:bg-xp-200',
        streak: 'bg-streak-100 text-streak-700 hover:bg-streak-200',
        neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
        outline: 'border border-neutral-200 text-neutral-700',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
