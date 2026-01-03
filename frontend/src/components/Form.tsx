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

import React, { forwardRef } from 'react';
import type { FieldValues, SubmitHandler, FieldError } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

// Simple cn utility
function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs));
}

// Simple Form wrapper
interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit: () => void | Promise<void>;
  children: React.ReactNode;
}

export function Form({
  onSubmit,
  children,
  className,
  ...props
}: FormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  );
}

// Form item wrapper
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    );
  }
);
FormItem.displayName = 'FormItem';

// Form label
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, error, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-neutral-700',
          error && 'text-error-DEFAULT',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error-DEFAULT ml-1">*</span>}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

// Form error message
interface FormErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

export const FormError = forwardRef<HTMLParagraphElement, FormErrorMessageProps>(
  ({ className, message, children, ...props }, ref) => {
    const displayMessage = message || children;
    if (!displayMessage) return null;

    return (
      <p
        ref={ref}
        className={cn('text-sm text-error-DEFAULT', className)}
        role="alert"
        {...props}
      >
        {displayMessage}
      </p>
    );
  }
);
FormError.displayName = 'FormError';

// Form description/help text
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-neutral-500', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormDescription.displayName = 'FormDescription';

// Styled form input with error state
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, hasError, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-4 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-error-DEFAULT focus:ring-error-light focus:border-error-DEFAULT'
            : 'border-neutral-300 focus:ring-primary-light focus:border-primary-DEFAULT',
          'disabled:bg-neutral-100 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
FormInput.displayName = 'FormInput';

// Re-export commonly used types
export type { SubmitHandler, FieldError, FieldValues };
