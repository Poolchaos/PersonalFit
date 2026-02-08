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
import { GlassCard } from '../auth/GlassCard';

interface OnboardingScreenProps {
  children: React.ReactNode;
  className?: string;
}

export const OnboardingScreen = ({ children, className = '' }: OnboardingScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full ${className}`}
    >
      <GlassCard className="max-w-2xl mx-auto">
        {children}
      </GlassCard>
    </motion.div>
  );
};
