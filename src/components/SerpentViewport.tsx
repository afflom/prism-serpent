import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  groundHeightAt,
  type PlayerControlInput,
  type PrismWorldState,
  type ShellState,
  stepPrismWorld,
} from '../game/prismEngine';
import type { SerpentSoundEngine } from '../game/soundEngine';
import { buildSerpentScene } from './SerpentSceneBuilder';

interface SerpentViewportProps {
  worldRef: React.MutableRefObject<PrismWorldState>;
  shellState: ShellState;
  soundEngine: SerpentSoundEngine;
  onHudSync: () => void;
  onRunEnded: (victory: boolean) => void;
}

export const SerpentViewport: React.FC<SerpentViewportProps> = ({
  worldRef,
  shellState,
  soundEngine,
  onHudSync,
  onRunEnded,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<ShellState>(shellState);
  const onHudSyncRef = useRef(onHudSync);
  const onRunEndedRef = useRef(onRunEnded);

  useEffect(() => {
    shellRef.current = shellState;
  }, [shellState]);

  useEffect(() => {
    onHudSyncRef.current = onHudSync;
  }, [onHudSync]);

  useEffect(() => {
    onRunEndedRef.current = onRunEnded;
  }, [onRunEnded]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL rasterizer (SwiftShader / Subzero / llvmpipe) BEFORE creating renderer
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    const dbg = probeGl?.getExtension('WEBGL_debug_renderer_info');
    const rendererInfo = [
      probeGl ? probeGl.getParameter(probeGl.RENDERER) : '',
      dbg && probeGl ? probeGl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '',
    ].join(' ');
    const isSoftwareGl = /SwiftShader|Subzero|llvmpipe|softpipe|Software|Basic Render/i.test(
      rendererInfo,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 0.85 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.domElement.className = 'block w-full h-full outline-none';
    container.appendChild(renderer.domElement);

    const sceneCtrl = buildSerpentScene(renderer, worldRef.current, isSoftwareGl);
    sceneCtrl.camera.aspect = width / Math.max(1, height);
    sceneCtrl.camera.updateProjectionMatrix();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(1, Math.floor(entry.contentRect.width));
      const h = Math.max(1, Math.floor(entry.contentRect.height));
      renderer.setSize(w, h);
      sceneCtrl.camera.aspect = w / h;
      sceneCtrl.camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // Keyboard & Pointer Input State
    const heldKeys = new Set<string>();
    let attuneLatched = false;
    let pointerActive = false;
    let pointerClientX = 0;
    let pointerClientY = 0;

    const clearHeldInputs = () => {
      heldKeys.clear();
      pointerActive = false;
      attuneLatched = false;
      soundEngine.updateBoostHum(false, false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      heldKeys.add(e.code);
      if (e.code === 'KeyE') {
        attuneLatched = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (shellRef.current !== 'playing') return;
      soundEngine.unlock();
      pointerActive = true;
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerActive) return;
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
    };

    const onPointerUp = () => {
      pointerActive = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    const onVisChange = () => {
      if (document.hidden) clearHeldInputs();
    };
    document.addEventListener('visibilitychange', onVisChange);

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Camera smoothing scratch vectors (zero per-frame allocation)
    const camCurrentPos = new THREE.Vector3(0, 14, 28);
    const camCurrentLook = new THREE.Vector3(0, 1.2, -8);
    const camDesiredPos = new THREE.Vector3();
    const camDesiredLook = new THREE.Vector3();

    let disposed = false;
    let rafId = 0;
    let lastTimeMs = performance.now();
    let visualClockSec = 0;
    let hudSyncAccum = 0;

    const gl = renderer.getContext() as WebGL2RenderingContext;
    const afterDraw = (cb: FrameRequestCallback) => {
      if (disposed) return;
      if (!isSoftwareGl || typeof gl.fenceSync !== 'function') {
        rafId = window.requestAnimationFrame(cb);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        rafId = window.requestAnimationFrame(cb);
        return;
      }
      const started = performance.now();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (
          status === gl.ALREADY_SIGNALED ||
          status === gl.CONDITION_SATISFIED ||
          performance.now() - started > 80
        ) {
          gl.deleteSync(sync);
          window.setTimeout(() => {
            if (!disposed) rafId = window.requestAnimationFrame(cb);
          }, 12);
        } else {
          window.setTimeout(poll, 4);
        }
      };
      window.setTimeout(poll, 0);
    };

    const tick: FrameRequestCallback = (nowMs) => {
      if (disposed) return;
      const rawDt = Math.max(0.001, (nowMs - lastTimeMs) / 1000);
      lastTimeMs = nowMs;
      const dt = Math.min(rawDt, 0.05);
      visualClockSec += dt;

      const world = worldRef.current;
      const modeState = shellRef.current;

      if (modeState === 'playing') {
        let steerDelta = 0;
        if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) steerDelta -= 1;
        if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) steerDelta += 1;

        const boostHeld =
          heldKeys.has('Space') ||
          heldKeys.has('KeyW') ||
          heldKeys.has('ArrowUp') ||
          heldKeys.has('ShiftLeft') ||
          heldKeys.has('ShiftRight');

        let targetWorldAngle: number | null = null;
        if (steerDelta === 0 && pointerActive) {
          const rect = domEl.getBoundingClientRect();
          const nx = (pointerClientX - (rect.left + rect.width * 0.5)) / (rect.width * 0.5);
          const ny = (pointerClientY - (rect.top + rect.height * 0.58)) / (rect.height * 0.5);
          if (Math.hypot(nx, ny) > 0.08) {
            const camForwardYaw = Math.atan2(
              camCurrentLook.z - camCurrentPos.z,
              camCurrentLook.x - camCurrentPos.x,
            );
            const screenAngle = Math.atan2(nx, -ny);
            targetWorldAngle = camForwardYaw + screenAngle;
          }
        }

        const control: PlayerControlInput = {
          steerDelta,
          targetWorldAngle,
          boostHeld,
          attunePressed: attuneLatched,
        };
        attuneLatched = false;

        stepPrismWorld(world, dt, control);

        soundEngine.updateBoostHum(
          world.player.isOverdrive,
          world.player.hyperCoreMs > 0,
        );

        // Dispatch audio & particle bursts for simulation events
        for (const ev of world.events) {
          if (ev.type === 'orb-pickup') {
            soundEngine.playOrbPickup(ev.comboCount ?? 1, ev.isLoot);
            sceneCtrl.spawnBurst(ev.x, ev.y, ev.z, ev.colorHex, ev.isLoot ? 14 : 8);
          } else if (ev.type === 'relic-pickup') {
            soundEngine.playRelicActivation(ev.relicKind ?? 'hyper-core');
            sceneCtrl.spawnBurst(ev.x, ev.y, ev.z, ev.colorHex, 24);
          } else if (ev.type === 'rival-eliminated') {
            soundEngine.playRivalElimination();
            sceneCtrl.spawnBurst(ev.x, ev.y, ev.z, ev.colorHex, 34);
          } else if (ev.type === 'player-hit') {
            soundEngine.playHullImpact();
            sceneCtrl.spawnBurst(ev.x, ev.y, ev.z, '#F43F5E', 26);
          } else if (ev.type === 'shrine-attuned') {
            soundEngine.playShrineAttuned(ev.shrineIndex ?? 0);
            sceneCtrl.spawnBurst(ev.x, ev.y + 4, ev.z, ev.colorHex, 36);
          } else if (ev.type === 'rival-telegraph') {
            soundEngine.playRivalChargeTelegraph();
          } else if (ev.type === 'run-ended') {
            soundEngine.playRunOutcome(Boolean(ev.victory));
            onRunEndedRef.current(Boolean(ev.victory));
          }
        }
      } else if (modeState === 'title') {
        // Gentle live world animation on Title Screen so rivals glide and shrines shimmer
        stepPrismWorld(world, dt * 0.55, {
          steerDelta: Math.sin(visualClockSec * 0.7) * 0.35,
          targetWorldAngle: null,
          boostHeld: false,
          attunePressed: false,
        });
        // Keep player safe during title showcase
        world.player.invulnerableMs = 2000;
        world.remainingArenaSec = 150;
      } else {
        soundEngine.updateBoostHum(false, false);
      }

      // Camera Rigging
      if (modeState === 'title') {
        // Sweeping hero flyover framing the Nexus Prime Monolith, coiled serpents, and glowing relics
        const orbitAngle = visualClockSec * 0.16 + 0.75;
        const orbitR = 30;
        camDesiredPos.set(
          Math.cos(orbitAngle) * orbitR,
          14.5 + Math.sin(visualClockSec * 0.4) * 1.8,
          Math.sin(orbitAngle) * orbitR + 4,
        );
        camDesiredLook.set(0, 2.4, -10);
        camCurrentPos.lerp(camDesiredPos, 1 - Math.exp(-3.5 * dt));
        camCurrentLook.lerp(camDesiredLook, 1 - Math.exp(-3.5 * dt));
      } else {
        const p = world.player;
        const segFactor = Math.min(1, p.segments.length / 95);
        let followDist = 11.2 + segFactor * 5.6;
        const followHeight = 7.4 + segFactor * 3.8;

        // Pull camera slightly inward near outer cliffs so perimeter basalt never blocks view
        const radial = Math.hypot(p.x, p.z);
        if (radial > world.worldRadius - 10) {
          const pull = (radial - (world.worldRadius - 10)) / 10;
          followDist *= 1 - Math.min(0.36, pull * 0.36);
        }

        const desiredX = p.x - Math.cos(p.heading) * followDist;
        const desiredZ = p.z - Math.sin(p.heading) * followDist;
        const groundUnderCam = groundHeightAt(desiredX, desiredZ);
        const desiredY = Math.max(groundUnderCam + 3.2, p.y + followHeight);

        camDesiredPos.set(desiredX, desiredY, desiredZ);
        camDesiredLook.set(
          p.x + Math.cos(p.heading) * 6.2,
          p.y + 0.65,
          p.z + Math.sin(p.heading) * 6.2,
        );

        const damp = 1 - Math.exp(-8.8 * dt);
        camCurrentPos.lerp(camDesiredPos, damp);
        camCurrentLook.lerp(camDesiredLook, damp);

        // Dynamic FOV kick during Overdrive or Hyper-Core surge
        const targetFov =
          p.hyperCoreMs > 0 ? 66 : p.isOverdrive ? 62 : 56;
        if (Math.abs(sceneCtrl.camera.fov - targetFov) > 0.08) {
          sceneCtrl.camera.fov = THREE.MathUtils.lerp(
            sceneCtrl.camera.fov,
            targetFov,
            1 - Math.exp(-7 * dt),
          );
          sceneCtrl.camera.updateProjectionMatrix();
        }
      }

      // Quadratic Trauma Shake (decays smoothly to zero)
      const shakeMag = world.cameraTrauma * world.cameraTrauma * 0.72;
      const sx = shakeMag > 0.001 ? Math.sin(visualClockSec * 47) * shakeMag : 0;
      const sy = shakeMag > 0.001 ? Math.cos(visualClockSec * 53) * shakeMag * 0.65 : 0;

      sceneCtrl.camera.position.set(
        camCurrentPos.x + sx,
        camCurrentPos.y + sy,
        camCurrentPos.z,
      );
      sceneCtrl.camera.lookAt(camCurrentLook);

      sceneCtrl.updateFromWorld(world, dt, visualClockSec);
      renderer.render(sceneCtrl.scene, sceneCtrl.camera);

      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.085) {
        hudSyncAccum = 0;
        onHudSyncRef.current();
      }

      afterDraw(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeldInputs);
      document.removeEventListener('visibilitychange', onVisChange);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      sceneCtrl.dispose();
      renderer.dispose();
      if (domEl.parentElement === container) {
        container.removeChild(domEl);
      }
    };
  }, [soundEngine, worldRef]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      data-testid="serpent-webgl-viewport"
    />
  );
};
