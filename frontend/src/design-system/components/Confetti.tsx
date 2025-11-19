import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
}

const colors = ['#00b8e6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i, // Unique ID using timestamp
    x: Math.random() * 100,
    y: -10,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    velocityX: (Math.random() - 0.5) * 2,
    velocityY: Math.random() * 2 + 1,
  }));
}

export function Confetti({ active, duration = 3000, particleCount = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active && particles.length === 0) {
      // Only generate particles when activated and none exist
      const newParticles = generateParticles(particleCount);
      setTimeout(() => setParticles(newParticles), 0);

      const timeout = setTimeout(() => {
        setParticles([]);
      }, duration);
      return () => clearTimeout(timeout);
    } else if (!active && particles.length > 0) {
      // Clear particles when deactivated
      setTimeout(() => setParticles([]), 0);
    }
  }, [active, duration, particleCount, particles.length]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
          }}
          initial={{
            y: particle.y,
            rotate: particle.rotation,
            opacity: 1,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, particle.velocityX * 100],
            rotate: [particle.rotation, particle.rotation + 360 * 2],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
