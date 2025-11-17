import { Award, Lock, CheckCircle, Trophy, Target, Zap, Calendar, TrendingUp } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: 'award' | 'trophy' | 'target' | 'zap' | 'calendar' | 'trending';
  category: 'workout' | 'streak' | 'progress' | 'milestone';
  requirement: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  animated?: boolean;
}

export function AchievementBadge({
  achievement,
  size = 'medium',
  showDetails = true,
  animated = true
}: AchievementBadgeProps) {
  const iconMap = {
    award: Award,
    trophy: Trophy,
    target: Target,
    zap: Zap,
    calendar: Calendar,
    trending: TrendingUp,
  };
  const IconComponent = iconMap[achievement.icon] || Award;

  const sizeClasses = {
    small: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-xs',
      badge: 'p-2'
    },
    medium: {
      container: 'w-24 h-24',
      icon: 'w-12 h-12',
      text: 'text-sm',
      badge: 'p-3'
    },
    large: {
      container: 'w-32 h-32',
      icon: 'w-16 h-16',
      text: 'text-base',
      badge: 'p-4'
    },
  };

  const classes = sizeClasses[size];

  const getCategoryColor = () => {
    const colors = {
      workout: 'from-blue-500 to-blue-600',
      streak: 'from-orange-500 to-red-600',
      progress: 'from-green-500 to-green-600',
      milestone: 'from-purple-500 to-purple-600',
    };
    return colors[achievement.category] || 'from-neutral-500 to-neutral-600';
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${showDetails ? 'max-w-xs' : ''}`}>
      {/* Badge */}
      <div
        className={`
          relative ${classes.container} ${classes.badge}
          rounded-full
          ${achievement.unlocked
            ? `bg-gradient-to-br ${getCategoryColor()} shadow-lg`
            : 'bg-neutral-300 opacity-50'
          }
          ${animated && achievement.unlocked ? 'hover:scale-110 transition-transform duration-300' : ''}
          flex items-center justify-center
        `}
      >
        {/* Glow effect for unlocked achievements */}
        {achievement.unlocked && animated && (
          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} rounded-full animate-pulse opacity-50 blur-md`} />
        )}

        {achievement.unlocked ? (
          <IconComponent className={`${classes.icon} text-white relative z-10`} />
        ) : (
          <Lock className={`${classes.icon} text-neutral-500 relative z-10`} />
        )}

        {/* Checkmark for unlocked */}
        {achievement.unlocked && (
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center space-y-1">
          <h4 className={`font-bold ${classes.text} ${achievement.unlocked ? 'text-neutral-900' : 'text-neutral-500'}`}>
            {achievement.name}
          </h4>
          <p className={`text-xs text-neutral-600`}>
            {achievement.description}
          </p>
          {!achievement.unlocked && (
            <p className={`text-xs text-neutral-500 italic`}>
              {achievement.requirement}
            </p>
          )}
          <div className={`flex items-center justify-center gap-1 ${classes.text}`}>
            <Award className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-600 font-semibold">+{achievement.xpReward} XP</span>
          </div>
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-neutral-500">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
