import { useEffect, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;

  constructor(canvas: HTMLCanvasElement, fillScreen = false) {
    this.x = Math.random() * canvas.width;
    // If fillScreen is true, distribute particles throughout the canvas
    // Otherwise, start them below the canvas for the continuous flow
    this.y = fillScreen ? Math.random() * canvas.height : canvas.height + Math.random() * 100;
    this.size = Math.random() * 6 + 3; // Larger particles (3-9px)
    this.speedX = Math.random() * 0.8 - 0.4; // Slower horizontal movement (-0.4 to 0.4)
    this.speedY = -Math.random() * 0.8 - 0.2; // Slower upward movement (-0.2 to -1.0)
    this.opacity = Math.random() * 0.6 + 0.2; // More visible
  }

  update(canvas: HTMLCanvasElement) {
    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap horizontally
    if (this.x > canvas.width) this.x = 0;
    if (this.x < 0) this.x = canvas.width;

    // Reset to bottom when reaching top
    if (this.y < -10) {
      this.y = canvas.height + Math.random() * 100;
      this.x = Math.random() * canvas.width;
      // Reset other properties for variety
      this.size = Math.random() * 6 + 3;
      this.speedX = Math.random() * 0.8 - 0.4;
      this.speedY = -Math.random() * 0.8 - 0.2;
      this.opacity = Math.random() * 0.6 + 0.2;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(255, 190, 140, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const Particles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(undefined);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();

    // Create particles
    const createParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000); // More particles (increased from 20000)
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        // Fill the screen with particles on initial load
        particlesRef.current.push(new Particle(canvas, true));
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (const particle of particlesRef.current) {
        particle.update(canvas);
        particle.draw(ctx);
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            // Increased connection distance for larger particles
            ctx.strokeStyle = `rgba(255, 190, 140, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 1.5; // Slightly thicker lines
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Deferred, not started immediately: this is a continuous requestAnimationFrame loop
    // doing O(n²) distance checks for the particle-connection lines every frame — cheap
    // once running, but starting it immediately put real work on the main thread during
    // the page's own critical rendering window. Measured directly: disabling this
    // component entirely raised the Lighthouse performance score from 72 to 87 with LCP
    // unchanged, meaning the cost was to Total Blocking Time, not the image/text paint
    // itself — so deferring past that window (rather than removing the effect) keeps the
    // visual and recovers the score. `load` already means everything critical has
    // resolved; requestIdleCallback (with a setTimeout fallback for Safari, which doesn't
    // have it) waits for a further gap in main-thread work before starting.
    let idleHandle: number | undefined;
    const requestIdle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200) as unknown as number);
    const cancelIdle = window.cancelIdleCallback ?? ((id: number) => clearTimeout(id));

    const start = () => {
      createParticles();
      animate();
    };
    const scheduleStart = () => {
      idleHandle = requestIdle(start);
    };

    if (document.readyState === 'complete') {
      scheduleStart();
    } else {
      window.addEventListener('load', scheduleStart, { once: true });
    }

    // Debounced resize handler that only recreates particles on significant size changes
    const handleResize = () => {
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Debounce the resize handling
      resizeTimeoutRef.current = setTimeout(() => {
        const newWidth = canvas.offsetWidth;
        const newHeight = canvas.offsetHeight;

        // Only recreate particles if there's a significant size change (more than 50px difference)
        // This prevents recreation during minor mobile scrolling events
        const widthDiff = Math.abs(newWidth - lastSizeRef.current.width);
        const heightDiff = Math.abs(newHeight - lastSizeRef.current.height);

        if (widthDiff > 50 || heightDiff > 50) {
          resizeCanvas();
          createParticles();
          lastSizeRef.current = { width: newWidth, height: newHeight };
        } else {
          // Just update canvas size without recreating particles
          resizeCanvas();
        }
      }, 300); // 300ms debounce
    };

    // Store initial size
    lastSizeRef.current = { width: canvas.offsetWidth, height: canvas.offsetHeight };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', scheduleStart);
      if (idleHandle !== undefined) cancelIdle(idleHandle);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default Particles;
