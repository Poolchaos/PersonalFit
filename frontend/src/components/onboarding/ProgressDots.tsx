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

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../design-system/utils/cn';

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
}

export const ProgressDots = ({ totalSteps, currentStep, className }: ProgressDotsProps) => {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={index} className="relative">
            {/* Dot — static glow instead of animated box-shadow */}
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                isCurrent && 'w-8',
                isCompleted && 'bg-achievement-DEFAULT',
                isCurrent && 'bg-primary-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
                !isCompleted && !isCurrent && 'bg-white/20'
              )}
            />

            {/* Completion checkmark animation */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
