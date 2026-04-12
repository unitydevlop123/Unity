import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import './AnimatedIntro.css';

interface AnimatedIntroProps {
  onComplete: () => void;
}

const AnimatedIntro: React.FC<AnimatedIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Particle System
    const particles: Particle[] = [];
    const particleCount = Math.min(window.innerWidth / 10, 100); // Responsive count

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1;
        // Emerald green variations
        this.color = `rgba(16, 163, 127, ${Math.random() * 0.5 + 0.2})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections first (behind particles)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 163, 127, ${1 - distance / 120})`;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    const timeout = setTimeout(() => {
      onComplete();
    }, 4000); // 4 seconds total duration

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="intro-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      <div className="intro-content z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-6 relative"
        >
           {/* Logo Icon */}
           <div className="w-24 h-24 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-emerald-500/30 shadow-[0_0_40px_rgba(16,163,127,0.4)]">
                <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
                    <circle cx="50" cy="50" r="48" fill="#10a37f" fillOpacity="0.2" />
                    <path d="M50 20 L80 70 L20 70 Z" fill="none" stroke="#10a37f" strokeWidth="4" strokeLinejoin="round" />
                    <circle cx="50" cy="45" r="8" fill="#fff" />
                </svg>
           </div>
        </motion.div>

        <h1 className="intro-title glitch-text" data-text="UNITY DEV STREAM">
          UNITY DEV STREAM
        </h1>
        
        <motion.div 
            className="h-0.5 bg-emerald-500 mt-4"
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />

        <p className="intro-subtitle text-emerald-400">
            INITIALIZING SYSTEM...
        </p>
      </div>
    </motion.div>
  );
};

export default AnimatedIntro;
