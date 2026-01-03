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

import { motion } from 'framer-motion';
import { Check, Lock, Sparkles } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    icon: React.ElementType;
    label: string;
    xp: number;
  }[];
}

export function OnboardingProgress({ currentStep, totalSteps, steps }: OnboardingProgressProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const totalXP = steps.reduce((sum, step) => sum + step.xp, 0);
  const earnedXP = steps.slice(0, currentStep + 1).reduce((sum, step) => sum + step.xp, 0);

  return (
    <div className="mb-8">
      {/* XP Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-600">Setup Progress</h3>
          <p className="text-xs text-neutral-500">Complete all steps to unlock your journey</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{earnedXP}</span>
            <span className="text-sm text-neutral-500">/ {totalXP} XP</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Setup XP Earned</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {steps.map((stepData, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLocked = index > currentStep;
          const Icon = stepData.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative rounded-xl p-4 transition-all duration-300 border-2
                ${isCompleted ? 'bg-gradient-to-br from-success-50 to-success-100 border-success-300' : ''}
                ${isCurrent ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-400 ring-4 ring-primary-200 shadow-lg' : ''}
                ${isLocked ? 'bg-neutral-50 border-neutral-200 opacity-60' : ''}
              `}
            >
              {/* Step Icon */}
              <div className={`
                w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center relative
                ${isCompleted ? 'bg-success-500' : ''}
                ${isCurrent ? 'bg-primary-500 animate-pulse' : ''}
                ${isLocked ? 'bg-neutral-300' : ''}
              `}>
                {isCompleted ? (
                  <Check className="w-6 h-6 text-white" />
                ) : isLocked ? (
                  <Lock className="w-6 h-6 text-neutral-500" />
                ) : (
                  <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-primary-600'}`} />
                )}

                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Step Label */}
              <div className="text-center">
                <p className={`text-xs font-semibold mb-1 ${
                  isCompleted ? 'text-success-700' :
                  isCurrent ? 'text-primary-700' :
                  'text-neutral-500'
                }`}>
                  {stepData.label}
                </p>

                {/* XP Badge */}
                <div className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                  ${isCompleted ? 'bg-success-200 text-success-800' : ''}
                  ${isCurrent ? 'bg-yellow-200 text-yellow-800' : ''}
                  ${isLocked ? 'bg-neutral-200 text-neutral-500' : ''}
                `}>
                  {isCompleted && <Check className="w-3 h-3" />}
                  {!isLocked && <Sparkles className="w-3 h-3" />}
                  <span>+{stepData.xp}</span>
                </div>
              </div>

              {/* Completion Checkmark */}
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
