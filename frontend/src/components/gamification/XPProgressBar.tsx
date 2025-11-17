import { useState, useEffect } from 'react';
import { TrendingUp, Award } from 'lucide-react';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function XPProgressBar({ currentXP, level, showAnimation = true, size = 'medium' }: XPProgressBarProps) {
  // Calculate XP needed for current level (100 * level^1.5)
  const xpForLevel = (lvl: number) => Math.floor(100 * Math.pow(lvl, 1.5));
  
  // XP needed for next level
  const xpForNextLevel = xpForLevel(level + 1);
  const xpForCurrentLevel = xpForLevel(level);
  
  // XP progress within current level
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);
  
  const [animatedXP, setAnimatedXP] = useState(showAnimation ? 0 : xpInCurrentLevel);
  
  // Animate XP counter
  useEffect(() => {
    if (!showAnimation) {
      return;
    }
    
    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = xpInCurrentLevel / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= xpInCurrentLevel) {
        setAnimatedXP(xpInCurrentLevel);
        clearInterval(timer);
      } else {
        setAnimatedXP(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [xpInCurrentLevel, showAnimation]);
  
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
            <Award className={iconSizeClasses[size]} />
            <span className={`font-bold ${textSizeClasses[size]}`}>Level {level}</span>
          </div>
          <div className="flex items-center gap-1 text-primary-600">
            <TrendingUp className={iconSizeClasses[size]} />
            <span className={`font-semibold ${textSizeClasses[size]}`}>
              {animatedXP.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
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
        {xpNeededForNextLevel - xpInCurrentLevel} XP until level {level + 1}
      </p>
    </div>
  );
}
