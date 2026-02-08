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
  const insightText = insight;

  // Typewriter effect for greeting
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => setIsTypingComplete(true), 500);
    }
  }, [displayedText, fullText]);

  return (
    <OnboardingScreen>
      <div className="space-y-8 text-center">
        {/* AI Avatar */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          <div className="relative w-32 h-32">
            {/* Rotating rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                style={{
                  scale: 1 + i * 0.2,
                }}
                animate={{
                  rotate: [0, 360],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}

            {/* Central orb image */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/images/onboarding/ai-avatar-orb.jpg"
                alt="AI Avatar"
                className="w-20 h-20 rounded-full object-cover"
                style={{
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
                }}
              />
            </motion.div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const radius = 50;
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary-400 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * radius],
                    y: [0, Math.sin(angle) * radius],
                    opacity: [0.8, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
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
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-0.5 h-8 bg-primary-400 ml-1"
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
            className="relative p-6 rounded-xl bg-gradient-to-br from-primary-500/10 to-achievement-DEFAULT/10 border border-primary-500/30 backdrop-blur-sm"
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
              <p className="text-white text-lg leading-relaxed">{insightText}</p>
            </motion.div>

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl blur-xl bg-gradient-to-br from-primary-500/20 to-achievement-DEFAULT/20"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ zIndex: -1 }}
            />
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
