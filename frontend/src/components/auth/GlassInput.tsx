/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../design-system/utils/cn';

interface GlassInputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
}

export const GlassInput = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
}: GlassInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      {/* Floating label */}
      <motion.label
        htmlFor={id}
        className={cn(
          'absolute left-4 transition-all duration-200 pointer-events-none z-10',
          isFocused || hasValue
            ? 'top-0 -translate-y-1/2 text-xs font-medium px-2 rounded-md bg-gradient-to-r from-[#1a0b2e] via-[#2D1B69] to-[#1a0b2e]'
            : 'top-1/2 -translate-y-1/2 text-sm font-medium'
        )}
        animate={{
          color: isFocused ? '#A78BFA' : 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {label}
      </motion.label>

      {/* Input with glow effect */}
      <motion.div
        className="relative"
        animate={{
          boxShadow: isFocused
            ? '0 0 0 2px rgba(124, 58, 237, 0.4), 0 0 20px rgba(124, 58, 237, 0.3)'
            : '0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        transition={{ duration: 0.2 }}
        style={{ borderRadius: '12px' }}
      >
        <input
          id={id}
          type={type}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          autoComplete={autoComplete}
          className={cn(
            'w-full px-4 py-3.5 rounded-xl',
            'bg-white/5',
            'border border-white/10',
            'text-white placeholder:text-white/30',
            'outline-none',
            'transition-all duration-200',
            'focus:bg-white/10',
            'focus:border-primary-500/50'
          )}
        />
      </motion.div>
    </div>
  );
};
