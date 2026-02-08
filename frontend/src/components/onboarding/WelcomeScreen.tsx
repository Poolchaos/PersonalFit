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
import { GlassButton } from '../auth/GlassButton';
import { ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/onboarding/health-data-streams.jpg"
          alt="Health data visualization"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1729]/80 via-[#0F1729]/90 to-[#0F1729]" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-3xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 blur-3xl bg-primary-500/30 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <Sparkles className="w-20 h-20 text-primary-400 relative" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          What if your body
          <br />
          <span className="bg-gradient-to-r from-primary-400 via-secondary-500 to-success-500 bg-clip-text text-transparent">
            could talk to you?
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          Lumi translates your health data into insights.
          <br />
          Track fitness, manage medications, understand patterns—all powered by AI.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <GlassButton
            onClick={onStart}
            variant="primary"
            className="px-8 py-4 text-lg group"
          >
            <span>Show me how</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </GlassButton>
        </motion.div>

        {/* Feature hints */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8 text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          {['🏋️ Fitness Tracking', '💊 Medication Management', '🧠 Mental Wellness', '📸 AI Vision Analysis'].map(
            (feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              >
                {feature}
              </motion.div>
            )
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
