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

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StepCompletionCelebrationProps {
  show: boolean;
  stepName: string;
  xpEarned: number;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export function StepCompletionCelebration({
  show,
  stepName,
  xpEarned,
  onComplete
}: StepCompletionCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles with predetermined colors
      const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[i % colors.length],
      }));

      // Schedule state update to avoid cascading renders
      setTimeout(() => setParticles(newParticles), 0);

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onComplete}
        >
          {/* Confetti Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                rotate: 0
              }}
              animate={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                scale: [0, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: particle.color,
              }}
            />
          ))}

          {/* Celebration Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            {/* Animated Icon */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
              }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            {/* Success Message */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-neutral-900 mb-2"
            >
              Step Complete! ðŸŽ‰
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-600 mb-4"
            >
              {stepName}
            </motion.p>

            {/* XP Earned */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg"
            >
              <TrendingUp className="w-6 h-6" />
              <span>+{xpEarned} XP</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-neutral-500 mt-4"
            >
              Keep going! You're doing great! ðŸ’ª
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
