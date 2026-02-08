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
import { Dumbbell, Pill, Brain, Camera } from 'lucide-react';
import { OnboardingScreen } from './OnboardingScreen';
import { GlassButton } from '../auth/GlassButton';
import { cn } from '../../design-system/utils/cn';

interface PathOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const paths: PathOption[] = [
  {
    id: 'fitness',
    icon: Dumbbell,
    title: 'Fitness',
    description: 'Track workouts & progress',
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'meds',
    icon: Pill,
    title: 'Medications',
    description: 'Manage & remind',
    color: 'from-secondary-500 to-secondary-600',
  },
  {
    id: 'mental',
    icon: Brain,
    title: 'Mental Wellness',
    description: 'Monitor mood & sleep',
    color: 'from-success-500 to-success-600',
  },
  {
    id: 'vision',
    icon: Camera,
    title: 'AI Vision',
    description: 'Scan food & analyze',
    color: 'from-achievement-DEFAULT to-achievement-dark',
  },
];

interface PathSelectionProps {
  selectedPaths: string[];
  onPathToggle: (pathId: string) => void;
  onContinue: () => void;
}

export const PathSelection = ({ selectedPaths, onPathToggle, onContinue }: PathSelectionProps) => {
  return (
    <OnboardingScreen>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Choose your path</h2>
          <p className="text-white/60">Select one or more areas to focus on</p>
        </motion.div>

        {/* Path cards */}
        <div className="grid grid-cols-2 gap-4">
          {paths.map((path, index) => {
            const Icon = path.icon;
            const isSelected = selectedPaths.includes(path.id);

            return (
              <motion.button
                key={path.id}
                onClick={() => onPathToggle(path.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative p-6 rounded-xl transition-all duration-300',
                  'bg-white/5 backdrop-blur-sm border-2',
                  'hover:bg-white/10',
                  isSelected
                    ? 'border-primary-500 bg-white/10'
                    : 'border-white/10'
                )}
              >
                {/* Glow effect when selected */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-xl blur-xl"
                    style={{
                      background: `linear-gradient(135deg, ${path.color})`,
                      opacity: 0.2,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <motion.div
                    className={cn(
                      'w-16 h-16 rounded-lg mb-4 flex items-center justify-center mx-auto',
                      `bg-gradient-to-br ${path.color}`,
                      isSelected ? 'opacity-100' : 'opacity-60'
                    )}
                    animate={
                      isSelected
                        ? {
                            boxShadow: [
                              '0 0 0px rgba(59, 130, 246, 0)',
                              '0 0 20px rgba(59, 130, 246, 0.4)',
                              '0 0 0px rgba(59, 130, 246, 0)',
                            ],
                          }
                        : {}
                    }
                    transition={{
                      boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Checkmark */}
                  {isSelected && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <motion.svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    </motion.div>
                  )}
                </div>

                {/* Text */}
                <div className="relative">
                  <h3 className={cn(
                    'font-semibold mb-1 transition-colors',
                    isSelected ? 'text-white' : 'text-white/80'
                  )}>
                    {path.title}
                  </h3>
                  <p className="text-sm text-white/50">{path.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedPaths.length > 0 ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <GlassButton
            onClick={onContinue}
            disabled={selectedPaths.length === 0}
            className="w-full"
          >
            Continue →
          </GlassButton>
        </motion.div>
      </div>
    </OnboardingScreen>
  );
};
