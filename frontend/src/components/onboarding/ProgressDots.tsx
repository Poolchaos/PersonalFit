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
            {/* Dot */}
            <motion.div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                isCurrent && 'w-8',
                isCompleted && 'bg-achievement-DEFAULT',
                isCurrent && 'bg-primary-500',
                !isCompleted && !isCurrent && 'bg-white/20'
              )}
              animate={
                isCurrent
                  ? {
                      boxShadow: [
                        '0 0 8px rgba(59, 130, 246, 0.4)',
                        '0 0 16px rgba(59, 130, 246, 0.6)',
                        '0 0 8px rgba(59, 130, 246, 0.4)',
                      ],
                    }
                  : {}
              }
              transition={{
                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
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
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
