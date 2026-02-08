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

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '../auth/AuroraBackground';
import { WelcomeScreen } from './WelcomeScreen';
import { PathSelection } from './PathSelection';
import { AIIntroduction } from './AIIntroduction';
import { OnboardingWizard } from './OnboardingWizard';
import { ProgressDots } from './ProgressDots';

export function EnhancedOnboarding() {
  const [flowStep, setFlowStep] = useState(0); // 0: welcome, 1: path selection, 2: AI intro, 3+: existing wizard
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

  // Total intro steps before main wizard
  const introSteps = 3;

  const handlePathToggle = (pathId: string) => {
    setSelectedPaths((prev) =>
      prev.includes(pathId) ? prev.filter((p) => p !== pathId) : [...prev, pathId]
    );
  };

  const generateInsight = (paths: string[]) => {
    if (paths.includes('fitness')) {
      return "To reach your fitness goals, consistency matters more than intensity. Let's build your sustainable plan.";
    }
    if (paths.includes('meds')) {
      return "Managing medications is easier when you have a system. Let's set up smart reminders for you.";
    }
    if (paths.includes('mental')) {
      return "Your mental wellness journey starts with awareness. I'll help you track patterns and insights.";
    }
    return "Your health journey is unique. I'll adapt to help you achieve your specific goals.";
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora background for intro steps */}
      {flowStep < introSteps && <AuroraBackground />}

      {/* Progress dots for intro steps */}
      {flowStep > 0 && flowStep < introSteps && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
          <ProgressDots totalSteps={introSteps - 1} currentStep={flowStep - 1} />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {flowStep === 0 && (
            <WelcomeScreen key="welcome" onStart={() => setFlowStep(1)} />
          )}

          {flowStep === 1 && (
            <div key="paths" className="min-h-screen flex items-center justify-center px-4 py-12">
              <PathSelection
                selectedPaths={selectedPaths}
                onPathToggle={handlePathToggle}
                onContinue={() => setFlowStep(2)}
              />
            </div>
          )}

          {flowStep === 2 && (
            <div key="ai-intro" className="min-h-screen flex items-center justify-center px-4 py-12">
              <AIIntroduction
                userName={userName || 'there'}
                insight={generateInsight(selectedPaths)}
                onContinue={() => setFlowStep(3)}
              />
            </div>
          )}

          {flowStep >= 3 && (
            <div key="wizard">
              <OnboardingWizard onUserNameCapture={setUserName} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
