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

import { Sparkles, Zap, Dumbbell, Target } from 'lucide-react';

export function GeneratingWorkoutLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center z-50">
      <div className="text-center text-white max-w-2xl px-8">
        {/* Animated icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Sparkles className="w-24 h-24 animate-pulse" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Sparkles className="w-24 h-24" />
            </div>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl font-bold mb-4 animate-fade-in">
          Crafting Your Perfect Workout Plan
        </h1>

        {/* Status messages with animation */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-center gap-3 text-lg animate-slide-in">
            <Zap className="w-5 h-5" />
            <span>Analyzing your fitness goals...</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg animate-slide-in animation-delay-300">
            <Dumbbell className="w-5 h-5" />
            <span>Customizing exercises for your experience level...</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg animate-slide-in animation-delay-600">
            <Target className="w-5 h-5" />
            <span>Optimizing for your equipment and schedule...</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress" />
        </div>

        <p className="text-sm mt-4 text-white/80">
          This may take 10-30 seconds...
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .animate-progress {
          animation: progress 20s ease-out;
        }
      `}</style>
    </div>
  );
}
