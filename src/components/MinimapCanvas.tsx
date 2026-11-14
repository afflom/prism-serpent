import React, { useEffect, useRef } from 'react';
import { FRONTIER_BIOMES, type PrismWorldState } from '../game/prismEngine';

interface MinimapCanvasProps {
  worldRef: React.MutableRefObject<PrismWorldState>;
}

/**
 * Real-time Spatial Radar Canvas projecting live world coordinates,
 * frontier biome rings, monolith shrines, special relics, rival NPCs, and player heading.
 */
export const MinimapCanvas: React.FC<MinimapCanvasProps> = ({ worldRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const renderRadar = () => {
      const canvas = canvasRef.current;
      const world = worldRef.current;
      if (canvas && world) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = canvas.width;
          const half = size / 2;
          const pad = 10;
          const scale = (half - pad) / world.worldRadius;

          ctx.clearRect(0, 0, size, size);

          // Obsidian radar disc
          ctx.save();
          ctx.beginPath();
          ctx.arc(half, half, half - 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(5, 9, 20, 0.86)';
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.42)';
          ctx.stroke();

          // Open-World biome boundary rings or Arena tactical ring
          if (world.mode === 'open-world') {
            const innerBowl = 26 * scale;
            const sanctumRing = 82 * scale;
            ctx.beginPath();
            ctx.arc(half, half, innerBowl, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(half, half, sanctumRing, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
            ctx.stroke();

            // Quadrant crosshairs
            ctx.beginPath();
            ctx.moveTo(half - sanctumRing, half);
            ctx.lineTo(half + sanctumRing, half);
            ctx.moveTo(half, half - sanctumRing);
            ctx.lineTo(half, half + sanctumRing);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(half, half, (half - pad) * 0.55, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Active Special Relics (small amber/cyan diamonds)
          for (const relic of world.relics) {
            if (!relic.active) continue;
            const rx = half + relic.x * scale;
            const rz = half + relic.z * scale;
            ctx.fillStyle = relic.kind === 'apex-crown' ? '#FBBF24' : '#38BDF8';
            ctx.beginPath();
            ctx.moveTo(rx, rz - 3);
            ctx.lineTo(rx + 3, rz);
            ctx.lineTo(rx, rz + 3);
            ctx.lineTo(rx - 3, rz);
            ctx.closePath();
            ctx.fill();
          }

          // Monolith Shrines
          const shrines =
            world.mode === 'open-world' ? world.shrines : world.shrines.slice(0, 1);
          for (const shrine of shrines) {
            const sx = half + shrine.x * scale;
            const sz = half + shrine.z * scale;
            ctx.strokeStyle = shrine.accentHex;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(sx, sz - 4.5);
            ctx.lineTo(sx + 4.5, sz);
            ctx.lineTo(sx, sz + 4.5);
            ctx.lineTo(sx - 4.5, sz);
            ctx.closePath();
            if (shrine.attuned) {
              ctx.fillStyle = shrine.accentHex;
              ctx.fill();
            }
            ctx.stroke();
          }

          // Rival NPC Serpents
          for (const rival of world.rivals) {
            if (!rival.alive) continue;
            const nx = half + rival.x * scale;
            const nz = half + rival.z * scale;
            ctx.fillStyle = rival.accentHex;
            ctx.beginPath();
            ctx.arc(nx, nz, rival.archetype === 'leviathan' ? 3.2 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Player Serpent + forward heading wedge
          const px = half + world.player.x * scale;
          const pz = half + world.player.z * scale;
          const heading = world.player.heading;

          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.arc(px, pz, 14, heading - 0.42, heading + 0.42);
          ctx.closePath();
          ctx.fillStyle = 'rgba(34, 211, 238, 0.24)';
          ctx.fill();

          ctx.fillStyle = '#ECFEFF';
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, pz, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }
    };

    renderRadar();
    const intervalId = window.setInterval(renderRadar, 66);
    return () => window.clearInterval(intervalId);
  }, [worldRef]);

  const biome = worldRef.current?.currentBiome ?? FRONTIER_BIOMES[0];

  return (
    <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        width={136}
        height={136}
        className="w-[136px] h-[136px] rounded-full shadow-[0_8px_24px_rgba(2,6,23,0.75)]"
        aria-label={`Spatial radar — current sector ${biome.name}`}
      />
    </div>
  );
};
