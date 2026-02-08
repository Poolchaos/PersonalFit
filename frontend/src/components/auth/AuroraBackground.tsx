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

import { useEffect, useRef } from 'react';

/**
 * High-performance Aurora Background
 *
 * Optimizations applied:
 * - Mouse tracking uses CSS custom properties via ref (zero React re-renders)
 * - Blur orbs reduced from 120px/100px/80px to 60px/50px/40px
 * - Aurora gradient uses CSS opacity crossfade (GPU-compositable) instead of
 *   animating the `background` property (forces full repaint every frame)
 * - No framer-motion (pure CSS transforms + transitions)
 * - Mouse events throttled via rAF
 * - will-change hints for GPU layer promotion
 */
export const AuroraBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle to animation frame (~60fps) — no React re-renders
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        container.style.setProperty('--mx', String(x));
        container.style.setProperty('--my', String(y));
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ '--mx': '0.5', '--my': '0.5' } as React.CSSProperties}
    >
      {/* Base gradient — static */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F1729] via-[#2D1B69] to-[#0F1729]" />

      {/* Aurora layers — CSS opacity crossfade (GPU-compositable) */}
      <div
        className="absolute inset-0 animate-aurora-a"
        style={{
          background: 'radial-gradient(circle at 20% 50%, #FFA726 0%, transparent 50%)',
          willChange: 'opacity',
        }}
      />
      <div
        className="absolute inset-0 animate-aurora-b"
        style={{
          background: 'radial-gradient(circle at 80% 50%, #00E5FF 0%, transparent 50%)',
          willChange: 'opacity',
        }}
      />
      <div
        className="absolute inset-0 animate-aurora-c"
        style={{
          background: 'radial-gradient(circle at 50% 80%, #FFA726 0%, transparent 50%)',
          willChange: 'opacity',
        }}
      />

      {/* Parallax orbs — CSS custom property driven (zero re-renders) */}
      {/* Blur radii halved: 120→60, 100→50, 80→40 for massive GPU savings */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[60px] bg-[#7C3AED] opacity-20"
        style={{
          top: '20%',
          left: '10%',
          transform: 'translate3d(calc(var(--mx) * 30px), calc(var(--my) * 30px), 0)',
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[50px] bg-[#FF6B9D] opacity-20"
        style={{
          bottom: '10%',
          right: '10%',
          transform: 'translate3d(calc(var(--mx) * -40px), calc(var(--my) * -40px), 0)',
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[40px] bg-[#10B981] opacity-15"
        style={{
          top: '60%',
          left: '50%',
          transform: 'translate3d(calc(var(--mx) * 20px), calc(var(--my) * 20px), 0)',
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
    </div>
  );
};
