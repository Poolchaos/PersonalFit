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
import { Calendar, Target, TrendingUp, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
}

export function QuickActions() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: Calendar,
      label: 'View Plan',
      description: 'Check your weekly schedule',
      path: '/workouts',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: Pill,
      label: 'Medications',
      description: 'Track meds & supplements',
      path: '/medications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Target,
      label: 'Set Goals',
      description: 'Update your fitness targets',
      path: '/accountability',
      color: 'text-success-dark',
      bgColor: 'bg-success-50',
    },
    {
      icon: TrendingUp,
      label: 'Metrics',
      description: 'Track body measurements',
      path: '/metrics',
      color: 'text-xp-dark',
      bgColor: 'bg-xp-50',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.bgColor} rounded-xl p-4 text-left hover:shadow-md transition-shadow`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className={`${action.color} mb-2`} size={24} />
              <p className="font-semibold text-neutral-900 text-sm mb-1">
                {action.label}
              </p>
              <p className="text-xs text-neutral-600">
                {action.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
