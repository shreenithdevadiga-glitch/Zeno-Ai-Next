import React, { useEffect, useRef, useState } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface ZenoOrbProps {
  state?: OrbState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '4k';
  interactive?: boolean;
  className?: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const ZenoOrb: React.FC<ZenoOrbProps> = ({
  state = 'idle',
  size = 'md',
  interactive = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });

  const sizePixels = {
    sm: 52,
    md: 140,
    lg: 260,
    xl: 360,
    '4k': 480
  }[size];

  // Mouse hover tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    mouseRef.current.targetX = Math.max(-1, Math.min(1, x));
    mouseRef.current.targetY = Math.max(-1, Math.min(1, y));
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Ultra-crisp 4K / High-DPI buffer scaling (up to 4x resolution)
    const dpr = Math.min(4, Math.max(2, window.devicePixelRatio || 2));
    canvas.width = Math.round(sizePixels * dpr);
    canvas.height = Math.round(sizePixels * dpr);

    const centerX = sizePixels / 2;
    const centerY = sizePixels / 2;
    const baseSphereRadius = sizePixels * 0.28;
    const cameraDist = sizePixels * 2.2;

    // Helper: 3D Projection
    const project = (p: Point3D): { x: number; y: number; scale: number; z: number } => {
      const perspective = cameraDist / (cameraDist + p.z);
      return {
        x: centerX + p.x * perspective,
        y: centerY + p.y * perspective,
        scale: perspective,
        z: p.z
      };
    };

    // Helper: 3D Vector Rotation (Euler angles: pitch X, yaw Y, roll Z)
    const rotate3D = (p: Point3D, rotX: number, rotY: number, rotZ: number): Point3D => {
      // Rotate around X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;

      // Rotate around Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;

      // Rotate around Z
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      return { x: x3, y: y3, z: z2 };
    };

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, sizePixels, sizePixels);

      // Smooth mouse interpolation
      mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.08;
      mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.08;

      const tiltX = mouseRef.current.currentY * 0.45;
      const tiltY = -mouseRef.current.currentX * 0.45;

      // Animation parameters
      let speed = 0.024;
      let pulse = Math.sin(angle * 2.2) * 3;

      if (state === 'listening') {
        speed = 0.045;
        pulse = Math.sin(angle * 4.5) * 6;
      } else if (state === 'thinking') {
        speed = 0.07;
        pulse = Math.sin(angle * 6) * 5;
      } else if (state === 'speaking') {
        speed = 0.05;
        pulse = (Math.sin(angle * 5) + Math.cos(angle * 3.2)) * 7;
      } else if (state === 'error') {
        speed = 0.015;
        pulse = Math.sin(angle * 8) * 1.5;
      }

      angle += speed;

      // Color scheme based on state
      const isErr = state === 'error';
      const cyanColor = isErr ? '#ef4444' : '#00e5ff';
      const purpleColor = isErr ? '#f97316' : '#c026d3';
      const royalBlueColor = isErr ? '#dc2626' : '#2563eb';

      // 1. BACKDROP AMBIENT GLOW CORONA
      const ambientGlow = ctx.createRadialGradient(
        centerX, centerY, baseSphereRadius * 0.2,
        centerX, centerY, baseSphereRadius * 1.7 + pulse
      );
      ambientGlow.addColorStop(0, isErr ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 162, 255, 0.48)');
      ambientGlow.addColorStop(0.4, isErr ? 'rgba(220, 38, 38, 0.22)' : 'rgba(139, 92, 246, 0.22)');
      ambientGlow.addColorStop(0.75, isErr ? 'rgba(185, 28, 28, 0.08)' : 'rgba(2, 132, 199, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseSphereRadius * 1.7 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Define 3D Rings
      // Ring 1: Purple/Magenta with beads (tilted ~30 deg)
      // Ring 2: Electric Cyan (tilted ~75 deg)
      // Ring 3: Deep Royal Blue (tilted ~-45 deg)
      const ring1Radius = baseSphereRadius * 1.48 + pulse * 0.3;
      const ring2Radius = baseSphereRadius * 1.42 + pulse * 0.2;
      const ring3Radius = baseSphereRadius * 1.45 + pulse * 0.4;

      const ringDefs = [
        {
          radius: ring1Radius,
          color: purpleColor,
          lineWidth: Math.max(1.8, sizePixels * 0.018),
          rotX: 0.55 + tiltX,
          rotY: angle * 0.9 + tiltY,
          rotZ: -0.25,
          hasNodes: true,
          nodeCount: size === 'sm' ? 6 : 11
        },
        {
          radius: ring2Radius,
          color: cyanColor,
          lineWidth: Math.max(1.8, sizePixels * 0.018),
          rotX: 1.25 + tiltX,
          rotY: -angle * 0.75 + tiltY,
          rotZ: 0.4,
          hasNodes: false,
          nodeCount: 0
        },
        {
          radius: ring3Radius,
          color: royalBlueColor,
          lineWidth: Math.max(1.6, sizePixels * 0.016),
          rotX: -0.7 + tiltX,
          rotY: angle * 0.85 + tiltY,
          rotZ: 0.6,
          hasNodes: false,
          nodeCount: 0
        }
      ];

      // Segment resolution
      const segments = size === 'sm' ? 40 : 100;

      // 2. DRAW BACK ARCS OF RINGS (Z < 0)
      ringDefs.forEach(ring => {
        ctx.beginPath();
        let started = false;

        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const localP: Point3D = {
            x: Math.cos(theta) * ring.radius,
            y: Math.sin(theta) * ring.radius,
            z: 0
          };
          const rotated = rotate3D(localP, ring.rotX, ring.rotY, ring.rotZ);
          const proj = project(rotated);

          if (proj.z <= 0) {
            if (!started) {
              ctx.moveTo(proj.x, proj.y);
              started = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          } else {
            started = false;
          }
        }

        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth * 0.85;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
      });

      // 3. DRAW BACK NODES (Photons behind sphere Z < 0)
      ringDefs.forEach(ring => {
        if (!ring.hasNodes) return;
        for (let n = 0; n < ring.nodeCount; n++) {
          const theta = (n / ring.nodeCount) * Math.PI * 2;
          const localP: Point3D = {
            x: Math.cos(theta) * ring.radius,
            y: Math.sin(theta) * ring.radius,
            z: 0
          };
          const rotated = rotate3D(localP, ring.rotX, ring.rotY, ring.rotZ);
          const proj = project(rotated);

          if (proj.z < 0) {
            ctx.beginPath();
            const nodeRadius = Math.max(2, sizePixels * 0.022) * proj.scale;
            ctx.arc(proj.x, proj.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fill();
          }
        }
      });

      // 4. DRAW CENTRAL LUMINOUS 3D SPHERE
      const currentRadius = baseSphereRadius + pulse * 0.3;
      const sphereGradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.28,
        centerY - currentRadius * 0.28,
        currentRadius * 0.05,
        centerX,
        centerY,
        currentRadius
      );

      if (isErr) {
        sphereGradient.addColorStop(0, '#ffffff');
        sphereGradient.addColorStop(0.2, '#fca5a5');
        sphereGradient.addColorStop(0.5, '#dc2626');
        sphereGradient.addColorStop(0.85, '#7f1d1d');
        sphereGradient.addColorStop(1, '#450a0a');
      } else {
        // Vibrant Electric Blue & Cyan with Intense White Hotspot
        sphereGradient.addColorStop(0, '#ffffff');
        sphereGradient.addColorStop(0.18, '#70f0ff');
        sphereGradient.addColorStop(0.38, '#00b4d8');
        sphereGradient.addColorStop(0.68, '#0260e8');
        sphereGradient.addColorStop(0.9, '#082f99');
        sphereGradient.addColorStop(1, '#05184f');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGradient;
      ctx.shadowColor = isErr ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 180, 255, 0.95)';
      ctx.shadowBlur = 28;
      ctx.fill();
      ctx.restore();

      // Specular Glint Highlight on Core
      ctx.save();
      const glintGrad = ctx.createRadialGradient(
        centerX - currentRadius * 0.32,
        centerY - currentRadius * 0.32,
        0,
        centerX - currentRadius * 0.32,
        centerY - currentRadius * 0.32,
        currentRadius * 0.45
      );
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      glintGrad.addColorStop(0.4, 'rgba(150, 240, 255, 0.6)');
      glintGrad.addColorStop(1, 'rgba(0, 180, 255, 0)');

      ctx.beginPath();
      ctx.arc(
        centerX - currentRadius * 0.32,
        centerY - currentRadius * 0.32,
        currentRadius * 0.45,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = glintGrad;
      ctx.fill();
      ctx.restore();

      // 5. DRAW FRONT ARCS OF RINGS (Z > 0)
      ringDefs.forEach(ring => {
        ctx.beginPath();
        let started = false;

        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const localP: Point3D = {
            x: Math.cos(theta) * ring.radius,
            y: Math.sin(theta) * ring.radius,
            z: 0
          };
          const rotated = rotate3D(localP, ring.rotX, ring.rotY, ring.rotZ);
          const proj = project(rotated);

          if (proj.z > 0) {
            if (!started) {
              ctx.moveTo(proj.x, proj.y);
              started = true;
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          } else {
            started = false;
          }
        }

        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth * 1.15;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
      });

      // 6. DRAW FRONT NODES (Photons in front of sphere Z > 0)
      ringDefs.forEach(ring => {
        if (!ring.hasNodes) return;
        for (let n = 0; n < ring.nodeCount; n++) {
          const theta = (n / ring.nodeCount) * Math.PI * 2;
          const localP: Point3D = {
            x: Math.cos(theta) * ring.radius,
            y: Math.sin(theta) * ring.radius,
            z: 0
          };
          const rotated = rotate3D(localP, ring.rotX, ring.rotY, ring.rotZ);
          const proj = project(rotated);

          if (proj.z >= 0) {
            ctx.beginPath();
            const nodeRadius = Math.max(2.4, sizePixels * 0.024) * proj.scale;
            ctx.arc(proj.x, proj.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 14;
            ctx.fill();

            // Outer cyan aura for front nodes
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, nodeRadius * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fill();
          }
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, size, sizePixels, interactive]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: sizePixels, height: sizePixels }}
        className="pointer-events-none drop-shadow-[0_0_35px_rgba(0,180,255,0.35)]"
      />
    </div>
  );
};
