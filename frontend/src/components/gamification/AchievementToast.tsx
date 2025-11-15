import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  xpReward?: number;
}

interface AchievementToastProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementToast({ achievement, isOpen, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      });

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-achievement-light to-achievement-dark p-6 rounded-2xl shadow-2xl text-white">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
              >
                <Trophy size={32} />
              </motion.div>

              <div className="flex-1">
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm font-medium opacity-90 mb-1">
                    Achievement Unlocked!
                  </p>
                  <p className="text-xl font-bold mb-1">{achievement.name}</p>
                  <p className="text-sm opacity-75 mb-2">{achievement.description}</p>
                  {achievement.xpReward && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-xs font-medium">
                      +{achievement.xpReward} XP
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
