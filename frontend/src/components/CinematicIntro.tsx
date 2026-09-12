import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<number>(0);

  // Particles Canvas Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[] = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p1.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Stage Boot Sequence Timings — auto-completes after subtitle, no button
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500);  // Particles
    const t2 = setTimeout(() => setStage(2), 1200); // Rings
    const t3 = setTimeout(() => setStage(3), 2000); // Logo Materialize
    const t4 = setTimeout(() => setStage(4), 2800); // Title Text
    const t5 = setTimeout(() => setStage(5), 3500); // Subtitle Text
    const t6 = setTimeout(() => onComplete(),  4200); // Auto-advance to portal

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050B14] overflow-hidden flex flex-col items-center justify-center font-sans select-none">
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-70" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 z-0" />

      {/* Cybernetic HUD Corner Brackets */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-[#00F0FF]/60 z-10">
        <Terminal className="w-4 h-4 text-[#00F0FF]" />
        <span>SYS_INIT :: STATS-O-LOCKED_v2.0</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-mono text-[#00F0FF]/60 z-10">
        <Cpu className="w-4 h-4 text-[#00F0FF]" />
        <span>SECURE NODE // VIT BHOPAL</span>
      </div>

      {/* Main Materialization Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">

        {/* Orbital Rings Stage */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative w-48 h-48 sm:w-56 sm:h-56 mb-6 flex items-center justify-center"
            >
              {/* Ring 1 (Cyan Rotating) */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00F0FF]/40 animate-spin-slow" />

              {/* Ring 2 (Purple Reverse) */}
              <div className="absolute inset-3 rounded-full border border-purple-500/40 border-t-transparent animate-[spin_12s_linear_infinite_reverse]" />

              {/* Outer Glow Orb */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-[#00F0FF]/20 via-[#0070F3]/30 to-[#7928CA]/30 blur-xl animate-pulse-slow" />

              {/* Logo Materialization Stage */}
              {stage >= 3 && (
                <motion.div
                  initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#00F0FF] cyan-glow overflow-hidden"
                >
                  <img
                    src="/stats_club_logo.png"
                    alt="Stats-O-Locked Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title Text Stage */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-wider bg-gradient-to-r from-white via-[#D0E7FF] to-[#00F0FF] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                STATS-O-LOCKED
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtitle Stage */}
        <AnimatePresence>
          {stage >= 5 && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2"
            >
              <p className="font-mono text-sm sm:text-base font-bold text-[#00F0FF] tracking-[0.25em] uppercase">
                VIT BHOPAL &bull; AI & DATA CLUB
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer System Status Bar */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-6 text-[11px] font-mono text-[#64748B] z-10">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM READY</span>
        <span>&bull;</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" /> SECURE SSL ENCRYPTION</span>
      </div>
    </div>
  );
};
