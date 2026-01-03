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

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, helperText, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-all',
              error
                ? 'border-error-DEFAULT bg-error-light/5 focus:border-error-DEFAULT focus:ring-error-DEFAULT'
                : success
                ? 'border-success-DEFAULT bg-success-light/5 focus:border-success-DEFAULT focus:ring-success-DEFAULT'
                : 'border-neutral-300 bg-white focus:border-primary-500 focus:ring-primary-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-neutral-100 disabled:cursor-not-allowed',
              isPassword && 'pr-12',
              (error || success) && !isPassword && 'pr-12',
              className
            )}
            {...props}
          />

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}

          {/* Status Icon */}
          {(error || success) && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error && <AlertCircle size={20} className="text-error-DEFAULT" />}
              {success && <CheckCircle size={20} className="text-success-DEFAULT" />}
            </div>
          )}
        </div>

        {/* Error/Success/Helper Text */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-error-DEFAULT flex items-center gap-1"
            >
              <AlertCircle size={14} />
              {error}
            </motion.p>
          )}
          {success && !error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-success-DEFAULT flex items-center gap-1"
            >
              <CheckCircle size={14} />
              {success}
            </motion.p>
          )}
          {helperText && !error && !success && (
            <p className="text-sm text-neutral-500">{helperText}</p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
