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
import { useState, useEffect } from 'react';
import { OnboardingScreen } from './OnboardingScreen';
import { GlassButton } from '../auth/GlassButton';
import { Lightbulb } from 'lucide-react';

interface AIIntroductionProps {
  userName: string;
  insight: string;
  onContinue: () => void;
}

export const AIIntroduction = ({ userName, insight, onContinue }: AIIntroductionProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = `Hi ${userName}, I'm your Lumi AI`;

  // Typewriter effect for greeting
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setIsTypingComplete(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, fullText]);

  return (
    <OnboardingScreen>
      <div className="space-y-8 text-center">
        {/* AI Avatar — simplified: 1 CSS ring rotation + static orb */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          <div className="relative w-32 h-32">
            {/* Single rotating ring — CSS animation (GPU transform) */}
            <div
              className="absolute inset-0 rounded-full border-2 border-primary-500/30 animate-spin"
              style={{
                animationDuration: '6s',
                scale: '1.2',
                willChange: 'transform',
              }}
            />
            {/* Second ring — counter-rotate, CSS only */}
            <div
              className="absolute inset-0 rounded-full border border-primary-400/20 animate-spin"
              style={{
                animationDuration: '10s',
                animationDirection: 'reverse',
                scale: '1.4',
                willChange: 'transform',
              }}
            />

            {/* Lumi Spark Logo — slow CSS rotation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="animate-spin"
                style={{ animationDuration: '15s', willChange: 'transform' }}
              >
                <img
                  src="/images/lumi-spark-logo.svg"
                  alt="Lumi AI"
                  className="w-16 h-16"
                />
              </div>
            </div>

            {/* Central orb image — static (no scale pulse) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/images/onboarding/ai-avatar-orb.jpg"
                alt="AI Avatar"
                className="w-20 h-20 rounded-full object-cover"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Greeting with typewriter effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2 min-h-[2.5rem]">
            {displayedText}
            {!isTypingComplete && (
              <span
                className="inline-block w-0.5 h-8 bg-primary-400 ml-1 animate-pulse"
              />
            )}
          </h2>
        </motion.div>

        {/* Insight card */}
        {isTypingComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative p-6 rounded-xl bg-gradient-to-br from-primary-500/10 to-achievement-DEFAULT/10 border border-primary-500/30"
          >
            {/* Icon */}
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-achievement-light to-achievement-DEFAULT flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" fill="currentColor" />
              </div>
            </motion.div>

            {/* Insight text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-sm text-primary-300 font-medium mb-2">Your first insight</p>
              <p className="text-white text-lg leading-relaxed">{insight}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Continue button */}
        {isTypingComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassButton onClick={onContinue} className="w-full">
              That's amazing! →
            </GlassButton>
          </motion.div>
        )}
      </div>
    </OnboardingScreen>
  );
};
