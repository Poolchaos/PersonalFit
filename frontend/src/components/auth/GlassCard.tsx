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

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        // Base glass effect — backdrop-blur-md for performance (12px vs 24px)
        'relative backdrop-blur-md bg-white/[0.12]',
        // Border with glow
        'border border-white/20',
        // Shadow with Electric Violet glow
        'shadow-[0_8px_32px_0_rgba(124,58,237,0.2)]',
        // Rounded corners
        'rounded-2xl',
        // Padding
        'p-8',
        // Hover effect
        'transition-all duration-300',
        'hover:shadow-[0_8px_32px_0_rgba(124,58,237,0.3)]',
        'hover:border-white/30',
        className
      )}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
