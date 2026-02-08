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

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../design-system/utils/cn';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const GlassButton = ({
  children,
  onClick,
  type = 'button',
  loading = false,
  disabled = false,
  variant = 'primary',
  className,
}: GlassButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'relative px-6 py-3.5 rounded-xl font-medium',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'overflow-hidden',
        isPrimary
          ? [
              'bg-gradient-to-r from-[#7C3AED] to-[#9333EA]',
              'text-white',
              'shadow-[0_0_20px_rgba(124,58,237,0.4)]',
              'hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]',
              'hover:scale-[1.02]',
              'active:scale-[0.98]',
            ]
          : [
              'bg-white/10',
              'text-white',
              'border border-white/20',
              'hover:bg-white/20',
              'hover:border-white/30',
            ],
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {/* Ripple effect on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ scale: 0, opacity: 0.5 }}
          whileHover={{
            scale: 2,
            opacity: 0,
            transition: { duration: 0.6 },
          }}
          style={{
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
};
