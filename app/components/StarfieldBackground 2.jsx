import { useEffect, useRef, useState } from 'react';

// Mock supabase for demo - replace with: import { supabase } from '../../lib/supabase';
const supabase = {
  from: () => ({
    select: async () => ({ count: 75, error: null })
  })
};

function StarfieldBackground() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const starsRef = useRef([]);
  const isActiveRef = useRef(true);
  const [starCount, setStarCount] = useState(75); // Default fallback count

  // Physics constants - tuned for curious, alive behavior with life cycles
  const GRAVITY = 0.02;
  const REPULSION_STRENGTH = 15;
  const REPULSION_DISTANCE = 100;
  const DAMPING = 0.995;
  const MAX_VELOCITY = 8;
  const STAR_SIZE = 1.5;
  const CURIOSITY_STRENGTH = 0.5;
  const PULSE_CHANCE = 0.008;
  const WANDER_STRENGTH = 0.4;
  
  // Cluster life cycle constants
  const BONDING_DISTANCE = 120;
  const BONDING_STRENGTH = 0.3;
  const CLUSTER_COHESION = 0.15;
  const RESTLESSNESS_CHANCE = 0.002;
  const SEPARATION_IMPULSE = 6;

  // Fetch actual user count from database
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // Use count query for efficiency - only get the count, not all data
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.warn('Could not fetch user count:', error.message);
          return;
        }

        if (count !== null && count > 0) {
          // Use actual user count, but cap at reasonable maximum for performance
          const maxStars = 200;
          setStarCount(Math.min(count, maxStars));
        }
      } catch (err) {
        console.warn('Error fetching user count:', err);
      }
    };

    fetchUserCount();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setCanvasSize();

    const initStars = (count) => {
      starsRef.current = [];
      for (let i = 0; i < count; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          bonds: [],
          clusterAge: 0,
          isRestless: false,
        });
      }
    };
    initStars(starCount);

    const handleResize = () => {
      setCanvasSize();
      starsRef.current = starsRef.current.map(star => ({
        ...star,
        x: Math.min(star.x, width),
        y: Math.min(star.y, height),
      }));
    };
    window.addEventListener('resize', handleResize);

    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const distance = (x1, y1, x2, y2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const updateStars = () => {
      const stars = starsRef.current;
      
      for (let i = 0; i < stars.length; i++) {
        let fx = 0;
        let fy = 0;

        stars[i].clusterAge += 1;
        
        if (stars[i].bonds.length > 0 && Math.random() < RESTLESSNESS_CHANCE) {
          stars[i].isRestless = true;
        }
        
        if (stars[i].isRestless && Math.random() < 0.01) {
          const angle = Math.random() * Math.PI * 2;
          fx += Math.cos(angle) * SEPARATION_IMPULSE;
          fy += Math.sin(angle) * SEPARATION_IMPULSE;
          stars[i].bonds = [];
          stars[i].clusterAge = 0;
          stars[i].isRestless = false;
        }

        const wanderMultiplier = stars[i].bonds.length === 0 ? 1 : 0.3;
        fx += (Math.random() - 0.5) * WANDER_STRENGTH * wanderMultiplier;
        fy += (Math.random() - 0.5) * WANDER_STRENGTH * wanderMultiplier;

        fx += (Math.random() - 0.5) * CURIOSITY_STRENGTH * wanderMultiplier;
        fy += (Math.random() - 0.5) * CURIOSITY_STRENGTH * wanderMultiplier;

        const burstChance = stars[i].bonds.length === 0 ? PULSE_CHANCE : PULSE_CHANCE * 0.3;
        if (Math.random() < burstChance) {
          const angle = Math.random() * Math.PI * 2;
          fx += Math.cos(angle) * 8;
          fy += Math.sin(angle) * 8;
        }

        for (let j = 0; j < stars.length; j++) {
          if (i === j) continue;

          const dist = distance(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
          
          if (dist < 1) continue;

          const dx = (stars[j].x - stars[i].x) / dist;
          const dy = (stars[j].y - stars[i].y) / dist;

          const isBonded = stars[i].bonds.includes(j);

          if (!isBonded && !stars[i].isRestless && dist < BONDING_DISTANCE && stars[i].bonds.length < 8) {
            stars[i].bonds.push(j);
            stars[i].clusterAge = 0;
          }

          if (isBonded) {
            const bondForce = CLUSTER_COHESION / Math.max(dist * 0.1, 1);
            fx += dx * bondForce;
            fy += dy * bondForce;
            
            if (dist > BONDING_DISTANCE * 2 || stars[i].isRestless) {
              stars[i].bonds = stars[i].bonds.filter(b => b !== j);
            }
          }
          else if (dist < BONDING_DISTANCE && !stars[i].isRestless) {
            const bondingForce = BONDING_STRENGTH / Math.max(dist * 0.5, 1);
            fx += dx * bondingForce;
            fy += dy * bondingForce;
          }
          else if (dist < REPULSION_DISTANCE * 0.3) {
            const force = REPULSION_STRENGTH / (dist * dist);
            fx -= dx * force;
            fy -= dy * force;
          }
          else if (dist < REPULSION_DISTANCE * 0.7) {
            const force = (REPULSION_STRENGTH * 0.15) / (dist * dist);
            fx -= dx * force;
            fy -= dy * force;
          }
          else if (dist < REPULSION_DISTANCE * 3 && stars[i].bonds.length === 0) {
            const force = GRAVITY / (dist * 3);
            fx += dx * force;
            fy += dy * force;
          }
        }

        stars[i].vx += fx * 0.05;
        stars[i].vy += fy * 0.05;

        stars[i].vx *= DAMPING;
        stars[i].vy *= DAMPING;

        const vel = Math.sqrt(stars[i].vx * stars[i].vx + stars[i].vy * stars[i].vy);
        if (vel > MAX_VELOCITY) {
          stars[i].vx = (stars[i].vx / vel) * MAX_VELOCITY;
          stars[i].vy = (stars[i].vy / vel) * MAX_VELOCITY;
        }

        stars[i].x += stars[i].vx;
        stars[i].y += stars[i].vy;

        if (stars[i].x < 0) stars[i].x = width;
        if (stars[i].x > width) stars[i].x = 0;
        if (stars[i].y < 0) stars[i].y = height;
        if (stars[i].y > height) stars[i].y = 0;
      }
    };

    const draw = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a0e27');
      gradient.addColorStop(0.5, '#1a1f3a');
      gradient.addColorStop(1, '#0d1117');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        ctx.beginPath();
        ctx.arc(stars[i].x, stars[i].y, STAR_SIZE, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      if (isActiveRef.current) {
        updateStars();
        draw();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default StarfieldBackground;