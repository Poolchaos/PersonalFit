import { Home, Dumbbell, Camera, Trophy, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Dumbbell, label: 'Workouts', path: '/workouts' },
  { icon: Camera, label: 'Metrics', path: '/metrics' },
  { icon: Trophy, label: 'Goals', path: '/accountability' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 md:hidden safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center ${
                  isActive ? 'text-primary-500' : 'text-neutral-500'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-0 right-0 h-1 bg-primary-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
