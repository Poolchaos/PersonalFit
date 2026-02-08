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

interface LumiLogoProps {
  className?: string;
}

export const LumiLogo = ({ className = '' }: LumiLogoProps) => {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glow container */}
      <div className="relative">
        {/* Static glow — no animation, just a soft halo */}
        <div
          className="absolute inset-0 blur-2xl bg-[#7C3AED]/30 rounded-full scale-150"
        />

        {/* Logo content */}
        <div className="relative flex items-center gap-3">
          {/* Logo Icon — single slow CSS rotation (GPU-compositable transform) */}
          <div
            className="relative animate-spin"
            style={{
              animationDuration: '20s',
              willChange: 'transform',
            }}
          >
            <img
              src="/images/lumi-spark-logo.svg"
              alt="Lumi"
              className="w-12 h-12"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.6))'
              }}
            />
          </div>

          {/* Text */}
          <div>
            <motion.h1
              className="text-4xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Lumi
            </motion.h1>
            <motion.p
              className="text-sm text-[#A78BFA] font-light tracking-wide"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Your AI Health Lead
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
