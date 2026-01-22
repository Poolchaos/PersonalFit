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

import { useState, useEffect } from 'react';
import { getGamificationIcon } from '../../utils/imageHelpers';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  xpForNextLevel?: number;
  levelProgress?: number;
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function XPProgressBar({
  currentXP,
  level,
  xpForNextLevel = 500,
  levelProgress = 0,
  showAnimation = true,
  size = 'medium'
}: XPProgressBarProps) {
  // Use backend-calculated values
  const progressPercentage = Math.min(levelProgress, 100);

  const [animatedXP, setAnimatedXP] = useState(showAnimation ? 0 : currentXP);

  // Animate XP counter
  useEffect(() => {
    if (!showAnimation) {
      return;
    }

    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentXP) {
        setAnimatedXP(currentXP);
        clearInterval(timer);
      } else {
        setAnimatedXP(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentXP, showAnimation]);

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full shadow-md">
            <img
              src={getGamificationIcon('level-up')}
              alt="Level"
              className={iconSizeClasses[size]}
            />
            <span className={`font-bold ${textSizeClasses[size]}`}>Level {level}</span>
          </div>
          <div className="flex items-center gap-1 text-primary-600">
            <img
              src={getGamificationIcon('xp')}
              alt="XP"
              className={iconSizeClasses[size]}
            />
            <span className={`font-semibold ${textSizeClasses[size]}`}>
              {animatedXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
            </span>
          </div>
        </div>
        <span className={`text-neutral-500 ${textSizeClasses[size]}`}>
          {progressPercentage.toFixed(0)}%
        </span>
      </div>

      <div className={`w-full bg-neutral-200 rounded-full ${sizeClasses[size]} overflow-hidden shadow-inner`}>
        <div
          className={`bg-gradient-to-r from-primary-500 to-primary-600 ${sizeClasses[size]} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      <p className={`text-neutral-600 ${textSizeClasses[size]}`}>
        {xpForNextLevel - currentXP} XP until level {level + 1}
      </p>
    </div>
  );
}
